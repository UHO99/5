package com.mycom.myapp.team5.global.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.Record;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CouponIssueStreamBatchConsumer {

    private static final int BATCH_SIZE = 500;
    private static final String INSERT_SQL =
    """
    INSERT INTO coupon_issue (user_id, coupon_id, status, issued_at)
    VALUES (?, ?, 'ISSUED', NOW())
    ON DUPLICATE KEY UPDATE id = id
    """;

    private final StringRedisTemplate stringRedisTemplate;
    private final JdbcTemplate jdbcTemplate;

    @Scheduled(fixedDelay = 100)
    public void consume() {
        List<MapRecord<String, String, String>> records = stringRedisTemplate.<String, String>opsForStream().read(
                Consumer.from(CouponStreamKeys.CONSUMER_GROUP, CouponStreamKeys.CONSUMER_NAME),
                StreamReadOptions.empty().count(BATCH_SIZE).block(Duration.ofSeconds(2)),
                StreamOffset.create(CouponStreamKeys.STREAM_KEY, ReadOffset.lastConsumed())
        );

        if (records == null || records.isEmpty()) {
            return;
        }

        try {
            insertBatch(records);
            log.info("발급 이력 배치 저장 완료 - count={}", records.size());
            acknowledge(records);
        } catch (DataAccessException e) {
            log.error("배치 insert 실패(제약 위반 가능성) - 건별로 재시도합니다. count={}", records.size(), e);
            insertIndividually(records);
        }
    }

    private void insertBatch(List<MapRecord<String, String, String>> records) {
        jdbcTemplate.batchUpdate(INSERT_SQL, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                Map<String, String> fields = records.get(i).getValue();
                ps.setLong(1, Long.parseLong(fields.get("userId")));
                ps.setLong(2, Long.parseLong(fields.get("couponId")));
            }

            @Override
            public int getBatchSize() {
                return records.size();
            }
        });
    }

    // 배치 전체가 실패했을 때만 타는 경로 - 문제 있는 건만 정확히 걸러내기 위해 한 건씩 재시도한다.
    // 실패한 건은 ACK하지 않고 남겨서(PEL) 조용히 유실되지 않게 한다.
    private void insertIndividually(List<MapRecord<String, String, String>> records) {
        for (MapRecord<String, String, String> record : records) {
            Map<String, String> fields = record.getValue();
            long userId = Long.parseLong(fields.get("userId"));
            long couponId = Long.parseLong(fields.get("couponId"));

            try {
                jdbcTemplate.update(INSERT_SQL, userId, couponId);
                acknowledge(record.getId());
            } catch (DataAccessException e) {
                log.error("발급 이력 저장 실패(제약 위반) - couponId={}, userId={}, recordId={} - ACK 보류, 확인 필요", couponId, userId, record.getId(), e);
            }
        }
    }

    private void acknowledge(List<MapRecord<String, String, String>> records) {
        acknowledge(records.stream().map(Record::getId).toArray(RecordId[]::new));
    }

    private void acknowledge(RecordId... recordIds) {
        stringRedisTemplate.opsForStream().acknowledge(CouponStreamKeys.STREAM_KEY, CouponStreamKeys.CONSUMER_GROUP, recordIds);
    }
}
