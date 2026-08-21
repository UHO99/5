package com.mycom.myapp.team5.global.common.util;

import java.util.List;
import javax.sql.DataSource;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.domain.couponissue.repository.CouponIssueRepository;
import com.mycom.myapp.team5.domain.user.repository.UserRepository;
import com.mycom.myapp.team5.global.common.dto.ApiResponse;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;

import lombok.RequiredArgsConstructor;

/**
 * 더미데이터 재적재용 관리자 API
 *
 * <p>OPEN 쿠폰이 있으면 거부한다 — TRUNCATE 가 스케줄러(S012/S013, Stream Consumer)와
 * 같은 테이블을 동시에 건드릴 수 있는 유일한 상황이 "진행 중인 캠페인이 있을 때"이기
 * 때문. OPEN 쿠폰이 없으면 스케줄러가 그 테이블을 건드릴 일이 없어 안전하다.
 */
@RestController
@RequiredArgsConstructor
public class DummyDataController {

    private final CouponRepository couponRepository;
    private final CouponIssueRepository couponIssueRepository;
    private final UserRepository userRepository;
    private final DataSource dataSource;

    @GetMapping("/api/admin/dummy-data/counts")
    public ResponseEntity<ApiResponse<DummyDataAll.Counts>> counts() {
        DummyDataAll.Counts counts = new DummyDataAll.Counts(
                userRepository.count(), couponRepository.count(), couponIssueRepository.count());
        return ResponseEntity.ok(ApiResponse.success(counts));
    }

    @PostMapping("/api/admin/dummy-data/reload")
    public ResponseEntity<ApiResponse<DummyDataAll.Counts>> reload() throws Exception {
        List<Coupon> open = couponRepository.findByStatus(CouponStatus.OPEN);
        if (!open.isEmpty()) {
            throw new DummyDataException(DummyDataErrorCode.OPEN_COUPON_EXISTS);
        }

        DummyDataAll.Counts counts = DummyDataAll.run(dataSource);
        return ResponseEntity.ok(ApiResponse.success(counts));
    }
}
