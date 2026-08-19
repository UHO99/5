package com.mycom.myapp.team5.domain.coupon.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public CouponResponse getExampleById(Long id) {
        return CouponResponse.from(Coupon.builder().name("example").totalQuantity(0).build());
    }

    @Override
    public CouponResponse getCoupon(long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
        return CouponResponse.from(coupon);
    }

    @Override
    @Transactional
    public int decreaseStockBatch(long couponId, int requestedCount) {
        if (requestedCount <= 0) {
            return 0;
        }

        Coupon coupon = couponRepository.findByIdForUpdate(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));

        int granted = Math.min(coupon.getTotalQuantity(), requestedCount);
        if (granted > 0) {
            couponRepository.decreaseStockBy(couponId, granted);
        }
        return granted;
    }

	@Override
	public void validateIssueable(long couponId) {
		// 1) 쿠폰 존재 확인 -> 없으면 CP001
		Coupon coupon = couponRepository.findById(couponId)
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
		
		// 2) OPEN 상태가 아니면 발급 불가 -> CP002
		//		(Redis 키 유무로 간접 판정하던 기존 방식 대신 DB 상태를 직접 확인.
		//		 Redis 재시작 직후 재고 키가 아직 복구되지 않아도 OPEN 이면 발급 허용)
		if(coupon.getStatus() != CouponStatus.OPEN) {
			throw new CouponException(CouponErrorCode.COUPON_NOT_OPEN);
		}
	}

}
