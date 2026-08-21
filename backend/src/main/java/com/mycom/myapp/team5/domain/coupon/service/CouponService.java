package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponOverviewResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponSummary;
import com.mycom.myapp.team5.domain.coupon.dto.CouponUpdateRequest;

import java.util.List;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse create(CouponRequest request);

    CouponResponse update(long couponId, CouponUpdateRequest request);

    CouponResponse getCoupon(long couponId);

    List<CouponResponse> getCoupons();

    CouponOverviewResponse getOverview(long couponId);

    List<CouponOverviewResponse> getOverviews();

    int decreaseStockBatch(long couponId, int requestedCount);

    /**
     * 발급 전 쿠폰이 발급 가능한 상태(OPEN)인지 검증.
     * READY/CLOSE면 COUPON_NOT_OPEN(CP002), 없으면 COUPON_NOT_FOUND(CP001).
     */
    void validateIssueable(long couponId);

    List<CouponSummary> listAll();
}
