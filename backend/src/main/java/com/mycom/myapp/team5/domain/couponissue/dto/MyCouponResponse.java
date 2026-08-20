package com.mycom.myapp.team5.domain.couponissue.dto;

import java.time.LocalDateTime;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.couponissue.entity.CouponIssue;
import com.mycom.myapp.team5.global.common.enums.CouponIssueStatus;

public record MyCouponResponse (
	Long issueId,
	Long couponId,
	String couponName,
	CouponIssueStatus status,
	LocalDateTime issuedAt,
	LocalDateTime usedAt,
	LocalDateTime cancelAt,
	LocalDateTime expiredAt
) {
	public static MyCouponResponse of(CouponIssue issue, Coupon coupon) {
		return new MyCouponResponse(
				issue.getId(),
				issue.getCouponId(),
				coupon.getName(),
				issue.getStatus(),
				issue.getIssuedAt(),
				issue.getUsedAt(),
				issue.getCanceledAt(),
				issue.getExpiredAt()
		);
	}
}
