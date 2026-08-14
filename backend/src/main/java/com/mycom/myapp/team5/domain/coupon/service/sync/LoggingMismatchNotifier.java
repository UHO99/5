package com.mycom.myapp.team5.domain.coupon.service.sync;

import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingMismatchNotifier implements MismatchNotifier {

    @Override
    public void notify(CouponMismatchReport report) {
        log.error(
                "[{}] 쿠폰 재고<->이력 불일치 - couponId={}, recordedIssuedQuantity={}, actualIssuedCount={}, pendingInStream={}",
                CouponErrorCode.COUPON_STOCK_ISSUE_HISTORY_MISMATCH.getCode(),
                report.couponId(),
                report.recordedIssuedQuantity(),
                report.actualIssuedCount(),
                report.pendingCount()
        );
    }

}
