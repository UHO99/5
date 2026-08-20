package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.dto.CouponUpdateRequest;
import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public CouponResponse getExampleById(Long id) {
        return CouponResponse.from(Coupon.builder().name("example").totalQuantity(0).build());
    }

    /**
     * A003: DB에만 쿠폰을 생성한다. Redis 재고 적재(initStock)는 OPEN 스케줄 시점에 수행한다.
     */
    @Override
    @Transactional
    public CouponResponse create(CouponRequest request) {
        validatePeriod(request.startAt(), request.endAt());

        Coupon coupon = Coupon.builder()
                .name(request.name())
                .totalQuantity(request.totalQuantity())
                .startAt(request.startAt())
                .endAt(request.endAt())
                .build();

        return CouponResponse.from(couponRepository.save(coupon));
    }

    /**
     * A004: READY 상태 쿠폰의 재고/기간만 DB에서 수정한다. Redis는 갱신하지 않는다.
     */
    @Override
    @Transactional
    public CouponResponse update(long couponId, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));

        if (coupon.getStatus() != CouponStatus.READY) {
            throw new CouponException(CouponErrorCode.COUPON_STATUS_CONFLICT);
        }

        LocalDateTime nextStartAt = request.startAt() != null ? request.startAt() : coupon.getStartAt();
        LocalDateTime nextEndAt = request.endAt() != null ? request.endAt() : coupon.getEndAt();
        validatePeriod(nextStartAt, nextEndAt);

        coupon.updateStockAndPeriod(request.totalQuantity(), request.startAt(), request.endAt());
        return CouponResponse.from(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCoupon(long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
        return CouponResponse.from(coupon);
    }

    /**
     * U001: 쿠폰 목록 조회.
     */
    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getCoupons() {
        return couponRepository.findAll().stream()
                .map(CouponResponse::from)
                .toList();
    }

    private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt != null && endAt != null && !endAt.isAfter(startAt)) {
            throw new CouponException(CouponErrorCode.COUPON_INVALID_PERIOD);
        }
    }

    @Override
    @Transactional
    public int decreaseStockBatch(long couponId, int requestedCount) {
        if (requestedCount <= 0) {
            return 0;
        }

        Coupon coupon = couponRepository.findByIdForUpdate(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));

        int granted = Math.min(coupon.getTotalQuantity(), requestedCount);
        if (granted > 0) {
            couponRepository.decreaseStockBy(couponId, granted);
        }
        return granted;
    }

}
