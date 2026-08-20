package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponUpdateRequest;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse create(CouponRequest request);

    CouponResponse update(long couponId, CouponUpdateRequest request);

    CouponResponse getCoupon(long couponId);

    int decreaseStockBatch(long couponId, int requestedCount);

    /**
     * 발급 전 쿠폰이 발급 가능한 상태(OPEN)인지 검증
     * READY/CLOSE 상태면 COUPON_NOT_OPEN(CP002), 존재하지 않으면 COUPON_NOT_FOUND(CP001) 예외 발생
     */
    void validateIssueable(long couponId);
}
