package com.mycom.myapp.team5.domain.coupon.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.event.CouponOpenedEvent;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import com.mycom.myapp.team5.global.redis.CouponStockKeys;
import com.mycom.myapp.team5.global.redis.CouponStockRedisService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CouponStatusServiceImpl implements CouponStatusService {

	private final CouponRepository couponRepository;
	private final CouponStockRedisService couponStockRedisService;			// 기존 코드 재사용
	private final StringRedisTemplate stringRedisTemplate;					// CLOSE 시 키 삭제
	private final ApplicationEventPublisher eventPublisher;					// OPEN 시 Redis Stream 구독 즉시 트리거

	@Override
	@Transactional
	public void openCoupon(long couponId) {
		// 1) 비관적 락 조회 -> 동시 open 요청이 직렬화되어 한 번만 반영하여 멱등성 보장
		Coupon coupon = couponRepository.findByIdForUpdate(couponId)
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));

		// 2) 전이 규칙 검증 : READY가 아니면 409
		if(!coupon.getStatus().canTransitTo(CouponStatus.OPEN)) {
			throw new CouponException(CouponErrorCode.COUPON_STATUS_CONFLICT);
		}

		// 3) 상태 변경 (dirty checking -> 트랜잭션 커밋 시 UPDATE)
		coupon.open();

		// 4) Redis 재고 초기화 : 기존 initStock() 재사용
		couponStockRedisService.initStock(couponId, coupon.getTotalQuantity());

		// 5) Redis Stream 구독 즉시 트리거
		eventPublisher.publishEvent(new CouponOpenedEvent(couponId));
	}

	@Override
	@Transactional
	public void closeCoupon(long couponId) {
		Coupon coupon = couponRepository.findByIdForUpdate(couponId)
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
		
		if(!coupon.getStatus().canTransitTo(CouponStatus.CLOSE)) {
			throw new CouponException(CouponErrorCode.COUPON_STATUS_CONFLICT);
		}
		
		coupon.close();
		
		// CLOSE 시 재고 키 정리 (발급 파트가 더 이상 차감하지 못하도록)
		stringRedisTemplate.delete(CouponStockKeys.stockKey(couponId));
	}

	@Override
	public CouponStatus getStatus(long couponId) {
		return couponRepository.findById(couponId)
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND))
				.getStatus();
	}

}
