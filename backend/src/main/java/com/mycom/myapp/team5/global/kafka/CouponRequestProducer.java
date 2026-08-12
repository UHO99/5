package com.mycom.myapp.team5.global.kafka;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CouponRequestProducer {

    public static final String TOPIC = "coupon-issue-request";

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void request(long couponId, long userId) {
        kafkaTemplate.send(TOPIC, String.valueOf(couponId), couponId + ":" + userId);
    }

}
