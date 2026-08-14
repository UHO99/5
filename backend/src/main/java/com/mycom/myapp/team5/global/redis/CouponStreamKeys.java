package com.mycom.myapp.team5.global.redis;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public final class CouponStreamKeys {

    private static final String STREAM_KEY_PREFIX = "coupon:issue:request:stream:";
    public static final String CONSUMER_GROUP = "coupon-issue-group";
    public static final String CONSUMER_NAME = "coupon-issue-consumer-1";

    public static String streamKey(long couponId) {
        return STREAM_KEY_PREFIX + couponId;
    }

}
