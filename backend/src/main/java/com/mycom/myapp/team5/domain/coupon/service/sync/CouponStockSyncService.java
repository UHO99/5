package com.mycom.myapp.team5.domain.coupon.service.sync;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.domain.couponissue.repository.CouponIssueRepository;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import com.mycom.myapp.team5.global.redis.CouponStreamPendingChecker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * S012 - CLOSE된 쿠폰의 재고를 coupon_issue 실 발급 건수 기준으로 동기화한다.
*/
@Slf4j
@Component
@RequiredArgsConstructor
public class CouponStockSyncService {

    private final CouponRepository couponRepository;
    private final CouponIssueRepository couponIssueRepository;
    private final CouponStreamPendingChecker pendingChecker;

    @Scheduled(fixedDelay = 5000)
    public void syncClosedCoupons() {
        List<Coupon> targets = couponRepository.findByStatusAndIssuedQuantityIsNull(CouponStatus.CLOSE);
        for (Coupon coupon : targets) {
            syncIfDrained(coupon.getId());
        }
    }

    public void syncIfDrained(long couponId) {
        Coupon coupon = couponRepository.findById(couponId).orElse(null);
        if (coupon == null || coupon.getStatus() != CouponStatus.CLOSE || coupon.getIssuedQuantity() != null) {
            return;
        }

        if (!pendingChecker.isDrained(couponId)) {
            log.info("정합성 동기화 대기 - Redis Stream에 미처리 건이 남아있음. couponId={}", couponId);
            return;
        }

        Integer before = coupon.getIssuedQuantity();
        long issuedCount = couponIssueRepository.countByCouponId(couponId);
        coupon.syncIssuedQuantity((int) issuedCount);
        couponRepository.save(coupon);

        log.info("쿠폰 정합성 동기화 완료 - couponId={}, issuedQuantity(전={}, 후={})",
                couponId, before, issuedCount);
    }

}
