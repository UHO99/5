package com.mycom.myapp.team5.global.redis;

import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.mycom.myapp.team5.domain.coupon.service.CouponService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CouponIssueStreamProducer {

	private final StringRedisTemplate stringRedisTemplate;
	private final CouponStockRedisService couponStockRedisService;
	private final CouponService couponService;

	public void requestIssue(long couponId, long userId) {
		// 1. DB 기준으로 먼저 확인 - Redis 재고 키 유무와 무관하게, 진짜 오픈 상태인지 판정
		//    (Redis 재시작 직후 재고 키가 아직 복구 안 됐어도, DB가 OPEN이면 여기는 통과시킴)
		couponService.validateIssueable(couponId);

		// 2. Redis 게이트 - 1인1매 확인 + 원자적 재고 차감
		couponStockRedisService.issue(couponId, userId);

		// 3. 게이트를 통과한 요청만 스트림에 적재
		stringRedisTemplate.opsForStream().add(CouponStreamKeys.streamKey(couponId), Map.of("couponId", String.valueOf(couponId), "userId", String.valueOf(userId)));
	}

}
