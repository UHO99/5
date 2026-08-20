package com.mycom.myapp.team5.domain.coupon.controller;

import com.mycom.myapp.team5.domain.coupon.dto.CouponSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.service.CouponService;
import com.mycom.myapp.team5.domain.coupon.service.CouponStatusService;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import com.mycom.myapp.team5.global.redis.CouponIssueStreamProducer;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final CouponStatusService couponStatusService;				// 상태 전환 서비스 추가
    private final CouponIssueStreamProducer producer;

    @PostMapping("/{couponId}/issue")
    public ResponseEntity<Void> requestIssue(
            @PathVariable long couponId,
            @RequestParam long userId
    ) {
    	// 발급 전 OPEN 상태 검증 (READY/CLOSE/미존재 쿠폰은 여기서 차단)
    	couponService.validateIssueable(couponId);

    	// Redis 재고 차감 + Stream 적재 (기존 파잎프라인 유지)
        producer.requestIssue(couponId, userId);

        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{couponId}")
    public ResponseEntity<ApiResponse<CouponResponse>> getStock(@PathVariable long couponId) {
        return ResponseEntity.ok(ApiResponse.success(couponService.getCoupon(couponId)));
    }

    // 수동 OPEN : READY -> OPEN + Redis 재고 초기화 (스케줄러와 동일 로직 공유)
    @PostMapping("/api/admin/coupons/{couponId}/open")
    public ResponseEntity<ApiResponse<Void>> openCoupon(@PathVariable long couponId){
    	couponStatusService.openCoupon(couponId);
    	return ResponseEntity.ok(ApiResponse.successNoData());
    }

    // 수동 CLOSE : OPEN -> CLOSE + Redis 재고 키 정리
    @PostMapping("/api/admin/coupons/{couponId}/close")
    public ResponseEntity<ApiResponse<Void>> closeCoupon(@PathVariable long couponId){
    	couponStatusService.closeCoupon(couponId);
    	return ResponseEntity.ok(ApiResponse.successNoData());
    }

    // 현재 상태 조회 (관리자 확인용)
    @GetMapping("/api/admin/coupons/{couponId}/status")
    public ResponseEntity<ApiResponse<CouponStatus>> getCouponStatus(@PathVariable long couponId){
    	return ResponseEntity.ok(ApiResponse.success(couponStatusService.getStatus(couponId)));
    }
}
