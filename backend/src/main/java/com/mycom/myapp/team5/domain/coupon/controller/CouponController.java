package com.mycom.myapp.team5.domain.coupon.controller;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.service.CouponService;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import com.mycom.myapp.team5.global.redis.CouponIssueStreamProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * U001 등 사용자 쿠폰 API.
 */
@RestController
@RequestMapping("/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final CouponIssueStreamProducer producer;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getCoupons() {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCoupons()));
    }

    @GetMapping("/{couponId}")
    public ResponseEntity<ApiResponse<CouponResponse>> getCoupon(@PathVariable long couponId) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCoupon(couponId)));
    }

    @PostMapping("/{couponId}/issue")
    public ResponseEntity<Void> requestIssue(
            @PathVariable long couponId,
            @RequestParam long userId
    ) {
        producer.requestIssue(couponId, userId);
        return ResponseEntity.accepted().build();
    }
}
