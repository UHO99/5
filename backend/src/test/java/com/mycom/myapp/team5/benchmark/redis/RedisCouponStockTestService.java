package com.mycom.myapp.team5.benchmark.redis;

import java.util.Collections;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RedisCouponStockTestService {
	private final StringRedisTemplate redisTemplate;

	private static final String DECREASE_STOCK_SCRIPT = "local stock = tonumber(redis.call('get', KEYS[1])) " + "if stock and stock > 0 then " + "  redis.call('decr', KEYS[1]) " + "  return 1 " + "else " + "  return 0 " + "end";

	private static final DefaultRedisScript<Long> SCRIPT = new DefaultRedisScript<>(DECREASE_STOCK_SCRIPT, Long.class);

	public String stockKey(long couponId) {
		return "coupon:stock:" + couponId;
	}

	public void initStock(long couponId, int initialStock) {
		redisTemplate.opsForValue().set(stockKey(couponId), String.valueOf(initialStock));
	}

	public boolean decreaseStock(long couponId) {
		Long result = redisTemplate.execute(SCRIPT, Collections.singletonList(stockKey(couponId)));
		return result != null && result == 1;
	}

	public int getStock(long couponId) {
		String value = redisTemplate.opsForValue().get(stockKey(couponId));
		return value == null ? 0 : Integer.parseInt(value);
	}

	public void clear(long couponId) {
		redisTemplate.delete(stockKey(couponId));
	}
}
