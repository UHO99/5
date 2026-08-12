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
        return CouponResponse.from(new Coupon(1L, "example", 0));
    }

    @Override
    public CouponResponse getCoupon(long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
        return CouponResponse.from(coupon);
    }

    @Override
    @Transactional
    public int decreaseStock(long couponId) {
        return couponRepository.decreaseStock(couponId);
    }

}
