package com.mycom.myapp.team5.global.kafka;

import com.mycom.myapp.team5.domain.coupon.service.CouponService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

@Getter
@Slf4j
@Component
@RequiredArgsConstructor
public class CouponIssueConsumer {

    private final CouponService couponService;

    private final AtomicInteger processedCount = new AtomicInteger(0);
    private final AtomicInteger successCount = new AtomicInteger(0);

    @KafkaListener(topics = CouponRequestProducer.TOPIC, groupId = "coupon-issue-group", concurrency = "3")
    public void consume(String message) {
        String[] parts = message.split(":");
        long couponId = Long.parseLong(parts[0]);
        long userId = Long.parseLong(parts[1]);

        int updated = couponService.decreaseStock(couponId);
        if (updated > 0) {
            successCount.incrementAndGet();
        } else {
            log.debug("쿠폰 재고 소진으로 발급 실패 - couponId={}, userId={}", couponId, userId);
        }
        processedCount.incrementAndGet();
    }

    public void reset() {
        processedCount.set(0);
        successCount.set(0);
    }

}
