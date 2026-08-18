package com.mycom.myapp.team5.domain.coupon.repository;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.totalQuantity = c.totalQuantity - :amount WHERE c.id = :id")
    int decreaseStockBy(@Param("id") long id, @Param("amount") int amount);

    List<Coupon> findByStatus(CouponStatus status);

    List<Coupon> findByStatusAndIssuedQuantityIsNull(CouponStatus status);

    // S013 재검증 대상 - 한 번 정합성이 확정된(consistencyConfirmedAt != null) 쿠폰은 영구히 제외해
    // CLOSE 누적 건수만큼 매 사이클 부하가 무한정 커지는 것을 막는다.
    List<Coupon> findByStatusAndConsistencyConfirmedAtIsNull(CouponStatus status);

}
