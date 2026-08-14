package com.mycom.myapp.team5.global.redis;

import lombok.NoArgsConstructor;

// TODO: 아직 안정함 CouponStreamKeys
@NoArgsConstructor
public final class CouponStreamKeys {

    public static final String STREAM_KEY = "coupon:issue:request:stream";
    public static final String CONSUMER_GROUP = "coupon-issue-group";
    public static final String CONSUMER_NAME = "coupon-issue-consumer-1";

}
