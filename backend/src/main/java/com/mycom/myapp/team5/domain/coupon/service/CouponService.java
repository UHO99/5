package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponUpdateRequest;

import java.util.List;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse create(CouponRequest request);

    CouponResponse update(long couponId, CouponUpdateRequest request);

    CouponResponse getCoupon(long couponId);

    List<CouponResponse> getCoupons();

    int decreaseStockBatch(long couponId, int requestedCount);

}
