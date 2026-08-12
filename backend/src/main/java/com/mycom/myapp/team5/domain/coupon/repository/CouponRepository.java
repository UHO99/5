package com.mycom.myapp.team5.domain.coupon.repository;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.stock = c.stock - :amount WHERE c.id = :id")
    int decreaseStockBy(@Param("id") long id, @Param("amount") int amount);

}
