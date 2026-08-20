package com.mycom.myapp.team5.domain.couponissue.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycom.myapp.team5.domain.couponissue.dto.MyCouponResponse;
import com.mycom.myapp.team5.domain.couponissue.service.CouponIssueService;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class CouponIssueController {
	private final CouponIssueService couponIssueService;
	
	// 내 쿠폰 목록 조회 (최근 발급 순)
	@GetMapping("/api/my/coupons")
	public ResponseEntity<ApiResponse<List<MyCouponResponse>>> getMyCoupons(@RequestParam long userId){
		return ResponseEntity.ok(ApiResponse.success(couponIssueService.getMyCoupons(userId)));
	}
	
	// 내 쿠폰 단건 조회 (보인 소유만, 아닌 경우 CI002)
	@GetMapping("/api/my/coupons/{issueId}")
	public ResponseEntity<ApiResponse<MyCouponResponse>> getMyCoupon(@PathVariable long issueId, @RequestParam long userId){
		return ResponseEntity.ok(ApiResponse.success(couponIssueService.getMyCoupon(userId, issueId)));
	}
}
