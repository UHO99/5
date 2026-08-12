package com.mycom.myapp.team5.domain.coupon.repository;

import com.mycom.myapp.team5.domain.coupon.entity.Coupon;
<<<<<<< HEAD
import org.springframework.data.jpa.repository.JpaRepository;
=======
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
>>>>>>> 0cd88f8415108e5931b8ddbade1694bfde48f71a
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

<<<<<<< HEAD
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.stock = c.stock - 1 WHERE c.id = :id AND c.stock > 0")
    int decreaseStock(@Param("id") long id);
=======
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Coupon c SET c.stock = c.stock - :amount WHERE c.id = :id")
    int decreaseStockBy(@Param("id") long id, @Param("amount") int amount);
>>>>>>> 0cd88f8415108e5931b8ddbade1694bfde48f71a

}
