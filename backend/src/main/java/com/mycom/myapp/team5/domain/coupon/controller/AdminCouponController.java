package com.mycom.myapp.team5.domain.coupon.controller;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponUpdateRequest;
import com.mycom.myapp.team5.domain.coupon.service.CouponService;
import com.mycom.myapp.team5.global.aspect.LogDescription;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A003/A004 관리자 쿠폰 API.
 * Redis initStock은 호출하지 않는다 — OPEN 스케줄에서 적재.
 */
@RestController
@RequestMapping("/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    @LogDescription("쿠폰 생성 (관리자)")
    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> create(
            @Valid @RequestBody CouponRequest request
    ) {
        CouponResponse response = couponService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @LogDescription("쿠폰 재고/기간 수정 (관리자)")
    @PatchMapping("/{couponId}")
    public ResponseEntity<ApiResponse<CouponResponse>> update(
            @PathVariable long couponId,
            @Valid @RequestBody CouponUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(couponService.update(couponId, request)));
    }
}
