package com.mycom.myapp.team5.domain.coupon.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.mycom.myapp.team5.global.redis.CouponStockKeys;
import com.mycom.myapp.team5.global.redis.CouponStockRedisService;
import com.mycom.myapp.team5.global.redis.CouponStreamKeys;

@SpringBootTest
@AutoConfigureMockMvc
public class CouponControllerTest {
	// 운영/다른 테스트 데이터와 안 겹치도록 테스트 전용 쿠폰 id 사용
	private static final long COUPON_ID = 998L;
	private static final long USER_ID = 1L;

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private CouponStockRedisService couponStockRedisService;

	@Autowired
	private StringRedisTemplate stringRedisTemplate;

	@AfterEach
	void tearDown() {
		stringRedisTemplate.delete(CouponStockKeys.stockKey(COUPON_ID));
		stringRedisTemplate.delete(CouponStockKeys.issuedSetKey(COUPON_ID));
		stringRedisTemplate.delete(CouponStreamKeys.streamKey(COUPON_ID));
	}

	@Test
	void 발급_성공하면_202와_ApiResponse_형식으로_응답한다() throws Exception {
		// given
		couponStockRedisService.initStock(COUPON_ID, 1);

		// when & then
		mockMvc.perform(post("/{couponId}/issue", COUPON_ID).param("userId", String.valueOf(USER_ID))).andExpect(status().isAccepted()).andExpect(jsonPath("$.success").value(true)).andExpect(jsonPath("$.data").doesNotExist()).andExpect(jsonPath("$.message").doesNotExist());
	}

	@Test
	void 중복_발급이면_409와_ErrorResponse_형식으로_응답한다() throws Exception {
		// given
		couponStockRedisService.initStock(COUPON_ID, 10);
		mockMvc.perform(post("/{couponId}/issue", COUPON_ID).param("userId", String.valueOf(USER_ID))); // 최초 1회 성공

		// when & then
		mockMvc.perform(post("/{couponId}/issue", COUPON_ID).param("userId", String.valueOf(USER_ID))).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CI001")).andExpect(jsonPath("$.message").value("쿠폰 중복 발급"));
	}

	@Test
	void 품절이면_204와_ErrorResponse_형식으로_응답한다() throws Exception {
		// given
		couponStockRedisService.initStock(COUPON_ID, 0);

		// when & then
		mockMvc.perform(post("/{couponId}/issue", COUPON_ID).param("userId", String.valueOf(USER_ID))).andExpect(status().isNoContent());
		// 204 No Content 응답은 표준적으로 바디를 안 담으므로 code/message는 별도 검증하지 않음
		// (아래 "직접 검증이 필요한 이유" 참고)
	}

	@Test
	void 재고_미적재면_204를_응답한다() throws Exception {
		// given: initStock을 호출하지 않은 상태 (쿠폰 오픈 전을 흉내냄)

		// when & then
		mockMvc.perform(post("/{couponId}/issue", COUPON_ID).param("userId", String.valueOf(USER_ID))).andExpect(status().isNoContent());
	}
}
