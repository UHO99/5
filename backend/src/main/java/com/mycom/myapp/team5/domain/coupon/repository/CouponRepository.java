package com.mycom.myapp.team5.domain.coupon.repository;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.stock = c.stock - 1 WHERE c.id = :id AND c.stock > 0")
    int decreaseStock(@Param("id") long id);

}
