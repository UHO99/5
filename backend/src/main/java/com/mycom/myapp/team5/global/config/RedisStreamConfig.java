package com.mycom.myapp.team5.global.config;

import com.mycom.myapp.team5.global.redis.CouponStreamKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.core.StringRedisTemplate;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class RedisStreamConfig {

    private final StringRedisTemplate stringRedisTemplate;

    public void ensureConsumerGroup(String streamKey) {
        try {
            stringRedisTemplate
                    .opsForStream()
                    .createGroup(streamKey, ReadOffset.from("0"), CouponStreamKeys.CONSUMER_GROUP);
        } catch (RedisSystemException e) {
            log.debug("Consumer 그룹 이미 존재 : streamKey={}, group={}", streamKey, CouponStreamKeys.CONSUMER_GROUP);
        }
    }

}
