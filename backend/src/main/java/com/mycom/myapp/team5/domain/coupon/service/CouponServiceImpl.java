package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

}
