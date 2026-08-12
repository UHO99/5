package com.mycom.myapp.team5.domain.coupon.controller;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.global.kafka.CouponRequestProducer;
import com.mycom.myapp.team5.domain.coupon.service.CouponService;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final CouponRequestProducer producer;

    @PostMapping("/{couponId}/issue")
    public ResponseEntity<Void> requestIssue(
            @PathVariable long couponId,
            @RequestParam long userId
    ) {
        producer.request(couponId, userId);

        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{couponId}")
    public ResponseEntity<ApiResponse<CouponResponse>> getStock(@PathVariable long couponId) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCoupon(couponId)));
    }

}
