package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse create(CouponRequest request);

    CouponResponse getCoupon(long couponId);

    int decreaseStockBatch(long couponId, int requestedCount);

}
