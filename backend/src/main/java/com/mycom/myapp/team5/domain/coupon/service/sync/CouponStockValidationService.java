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
 * S013 - CLOSE된 쿠폰의 재고<->발급 이력 정합성을 주기적으로 재검증한다.
 * S012와 달리 이미 동기화된 쿠폰도 매번 다시 검증한다 - "한 번 맞았으니 계속 맞다"고 가정하지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CouponStockValidationService {

    private final CouponRepository couponRepository;
    private final CouponIssueRepository couponIssueRepository;
    private final CouponStreamPendingChecker pendingChecker;
    private final MismatchNotifier mismatchNotifier;

    @Scheduled(fixedDelay = 60_000)
    public void verifyClosedCoupons() {
        List<Coupon> targets = couponRepository.findByStatus(CouponStatus.CLOSE);

        int mismatchCount = 0;
        for (Coupon coupon : targets) {
            if (verify(coupon)) {
                mismatchCount++;
            }
        }

        log.info("S013 정합성 검증 배치 실행 완료 - 대상={}건, 불일치={}건", targets.size(), mismatchCount);
    }

    private boolean verify(Coupon coupon) {
        long actualIssuedCount = couponIssueRepository.countByCouponId(coupon.getId());
        long pendingCount = pendingChecker.pendingCount(coupon.getId());

        CouponMismatchReport report = new CouponMismatchReport(
                coupon.getId(), coupon.getIssuedQuantity(), actualIssuedCount, pendingCount
        );

        if (report.isMismatch()) {
            mismatchNotifier.notify(report);
            return true;
        }
        return false;
    }

}
