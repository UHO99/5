package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse getCoupon(long couponId);

    int decreaseStock(long couponId);

}
