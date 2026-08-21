package com.mycom.myapp.team5.domain.couponissue.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.domain.couponissue.dto.CouponIssueHistoryResponse;
import com.mycom.myapp.team5.domain.couponissue.dto.MyCouponResponse;
import com.mycom.myapp.team5.domain.couponissue.entity.CouponIssue;
import com.mycom.myapp.team5.domain.couponissue.repository.CouponIssueRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CouponIssueServiceImpl implements CouponIssueService{
	
	private final CouponIssueRepository couponIssueRepository;
	private final CouponRepository couponRepository;

	@Override
	@Transactional(readOnly=true)
	public List<MyCouponResponse> getMyCoupons(long userId) {
		List<CouponIssue> issues = couponIssueRepository.findByUserIdOrderByIssuedAtDesc(userId);
		if(issues.isEmpty()) {
		return List.of();
		}
		
		// N + 1 방지 : couponId 목록으로 쿠폰을 한 번에 조회 후 Map으로 조합 (S012 리팩토링과 동일한 방식)
		Map<Long, Coupon> couponMap = couponRepository.findAllById(
				issues.stream().map(CouponIssue::getCouponId).toList()
		).stream().collect(Collectors.toMap(Coupon::getId, Function.identity()));
		
        return issues.stream()
                .map(issue -> MyCouponResponse.of(issue, couponMap.get(issue.getCouponId())))
                .toList();
	}

	@Override
	@Transactional(readOnly=true)
	public MyCouponResponse getMyCoupon(long userId, long issueId) {
		CouponIssue issue = couponIssueRepository.findByIdAndUserId(issueId, userId)
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_ISSUE_NOT_FOUND));
		
		Coupon coupon = couponRepository.findById(issue.getCouponId())
				.orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
		return MyCouponResponse.of(issue, coupon);
	}

	@Override
	@Transactional(readOnly = true)
	public List<CouponIssueHistoryResponse> getIssuesByCouponId(long couponId) {
		if (!couponRepository.existsById(couponId)) {
			throw new CouponException(CouponErrorCode.COUPON_NOT_FOUND);
		}
		return couponIssueRepository.findByCouponIdOrderByIssuedAtDesc(couponId).stream()
				.map(CouponIssueHistoryResponse::from)
				.toList();
	}

}
