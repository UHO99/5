package com.mycom.myapp.team5.domain.coupon.controller;

import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.domain.couponissue.repository.CouponIssueRepository;
import com.mycom.myapp.team5.global.redis.CouponStockKeys;
import com.mycom.myapp.team5.global.redis.CouponStockRedisService;
import com.mycom.myapp.team5.global.redis.CouponStreamKeys;

@SpringBootTest
@AutoConfigureMockMvc
public class CouponControllerTest {
	private static final long USER_ID = 1L;

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private CouponStockRedisService couponStockRedisService;

	@Autowired
	private CouponRepository couponRepository;

	@Autowired
	private CouponIssueRepository couponIssueRepository;

	@Autowired
	private StringRedisTemplate stringRedisTemplate;

	private Long couponId;

	@AfterEach
	void tearDown() {
		if (couponId != null) {
			stringRedisTemplate.delete(CouponStockKeys.stockKey(couponId));
			stringRedisTemplate.delete(CouponStockKeys.issuedSetKey(couponId));
			stringRedisTemplate.delete(CouponStreamKeys.streamKey(couponId));

			// coupon_issue가 언제 채워질지 정확히 알 수 없으니(비동기 반영),
			// "더 이상 새로 안 생긴다"고 확신할 수 있을 때까지 짧게 반복 삭제 시도.
			// 마지막 시도 이후 잠깐 더 대기해서, 그 사이 뒤늦게 들어온 row까지 마저 지운다.
			await().atMost(Duration.ofSeconds(5)).pollInterval(Duration.ofMillis(200)).untilAsserted(() -> {
				couponIssueRepository.deleteByCouponId(couponId);
				long remaining = couponIssueRepository.countByCouponId(couponId);
				org.assertj.core.api.Assertions.assertThat(remaining).isZero();
			});

			couponRepository.deleteById(couponId);
		}
	}

	private Long createOpenCoupon(int totalQuantity) {
		Coupon coupon = Coupon.builder().name("컨트롤러-테스트-쿠폰").totalQuantity(totalQuantity).startAt(LocalDateTime.now().minusMinutes(1)).endAt(LocalDateTime.now().plusDays(1)).build();
		coupon.open();
		Coupon saved = couponRepository.save(coupon);
		couponStockRedisService.initStock(saved.getId(), totalQuantity);
		return saved.getId();
	}

	@Test
	void 발급_성공하면_202와_ApiResponse_형식으로_응답한다() throws Exception {
		couponId = createOpenCoupon(1);

		mockMvc.perform(post("/{couponId}/issue", couponId).param("userId", String.valueOf(USER_ID))).andExpect(status().isAccepted()).andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.data").doesNotExist()).andExpect(jsonPath("$.message").doesNotExist());
	}

	@Test
	void 중복_발급이면_409와_ErrorResponse_형식으로_응답한다() throws Exception {
		couponId = createOpenCoupon(10);
		mockMvc.perform(post("/{couponId}/issue", couponId).param("userId", String.valueOf(USER_ID)));

		mockMvc.perform(post("/{couponId}/issue", couponId).param("userId", String.valueOf(USER_ID))).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CI001")).andExpect(jsonPath("$.message").value("쿠폰 중복 발급"));
	}

	@Test
	void 품절이면_409와_ErrorResponse_형식으로_응답한다() throws Exception {
		couponId = createOpenCoupon(0);

		mockMvc.perform(post("/{couponId}/issue", couponId).param("userId", String.valueOf(USER_ID))).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RD002")).andExpect(jsonPath("$.message").value("재고 소진"));
	}

	@Test
	void 재고_미적재면_409와_ErrorResponse_형식으로_응답한다() throws Exception {
		Coupon coupon = Coupon.builder().name("오픈됐지만-재고없는-쿠폰").totalQuantity(10).startAt(LocalDateTime.now().minusMinutes(1)).endAt(LocalDateTime.now().plusDays(1)).build();
		coupon.open();
		couponId = couponRepository.save(coupon).getId();

		mockMvc.perform(post("/{couponId}/issue", couponId).param("userId", String.valueOf(USER_ID))).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("RD001")).andExpect(jsonPath("$.message").value("재고 미적재"));
	}
}
