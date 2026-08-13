package com.mycom.myapp.team5.domain.coupon.dto;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;

public record CouponResponse(
        Long id,
        String name,
        Integer totalQuantity
) {
    public static CouponResponse from(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getName(),
                coupon.getTotalQuantity()
        );
    }
}
