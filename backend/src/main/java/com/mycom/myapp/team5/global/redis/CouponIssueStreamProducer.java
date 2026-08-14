package com.mycom.myapp.team5.global.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class CouponIssueStreamProducer {

    private final StringRedisTemplate stringRedisTemplate;

    public void requestIssue(long couponId, long userId) {
        stringRedisTemplate.opsForStream().add(
                CouponStreamKeys.STREAM_KEY,
                Map.of("couponId", String.valueOf(couponId), "userId", String.valueOf(userId))
        );
    }

}
