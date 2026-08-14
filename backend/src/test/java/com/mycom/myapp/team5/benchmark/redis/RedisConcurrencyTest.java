package com.mycom.myapp.team5.benchmark.redis;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class RedisConcurrencyTest {

	private static final long COUPON_ID = 1L;
	private static final int INITIAL_STOCK = 10_000;
	private static final int REQUEST_COUNT = 100_000;

	@Autowired
	private RedisCouponStockTestService redisCouponStockTestService;

	@BeforeEach
	void setUp() {
		redisCouponStockTestService.initStock(COUPON_ID, INITIAL_STOCK);
	}

	@AfterEach
	void tearDown() {
		redisCouponStockTestService.clear(COUPON_ID);
	}

	@Test
	public void 십만명이_동시에_발급요청해도_재고는_정확히_만큼만_소진된다() throws InterruptedException {
		long start = System.currentTimeMillis();
		// given
		ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor();
		CountDownLatch requestsDone = new CountDownLatch(REQUEST_COUNT);
		AtomicInteger successCount = new AtomicInteger(0);

		// when: 동기 처리이므로 리턴값으로 바로 성공 여부 판단
		for (long userId = 1; userId <= REQUEST_COUNT; userId++) {
			executorService.execute(() -> {
				try {
					boolean success = redisCouponStockTestService.decreaseStock(COUPON_ID);
					if (success) {
						successCount.incrementAndGet();
					}
				}
				finally {
					requestsDone.countDown();
				}
			});
		}
		requestsDone.await();
		executorService.shutdown();
		long elapsed = System.currentTimeMillis() - start;

		// then
		assertThat(redisCouponStockTestService.getStock(COUPON_ID)).isZero();
		assertThat(successCount.get()).isEqualTo(INITIAL_STOCK);

		System.out.println("=====================================");
		System.out.println("Redis 동시성 테스트 소요 시간: " + elapsed + "ms");
		System.out.println("=====================================");
	}
}
