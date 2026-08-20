package com.mycom.myapp.team5.domain.couponissue.service;

import java.util.List;

import com.mycom.myapp.team5.domain.couponissue.dto.MyCouponResponse;

public interface CouponIssueService {
	// 내 쿠폰 목록 (최근 발급 순)
	List<MyCouponResponse> getMyCoupons(long userId);
	
	// 내 쿠폰 단건 (본인 소유만, 없으면 CI002)
	MyCouponResponse getMyCoupon(long userId, long issueId);
}
