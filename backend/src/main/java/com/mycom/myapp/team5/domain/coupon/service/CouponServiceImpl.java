package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponRequest;
import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;
import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.domain.coupon.exception.CouponErrorCode;
import com.mycom.myapp.team5.domain.coupon.exception.CouponException;
import com.mycom.myapp.team5.domain.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (request.startAt() != null
                && request.endAt() != null
                && !request.endAt().isAfter(request.startAt())) {
            throw new CouponException(CouponErrorCode.COUPON_INVALID_PERIOD);
        }

        Coupon coupon = Coupon.builder()
                .name(request.name())
                .totalQuantity(request.totalQuantity())
                .startAt(request.startAt())
                .endAt(request.endAt())
                .build();

        return CouponResponse.from(couponRepository.save(coupon));
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCoupon(long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new CouponException(CouponErrorCode.COUPON_NOT_FOUND));
        return CouponResponse.from(coupon);
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
