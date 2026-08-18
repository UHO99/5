package com.mycom.myapp.team5.domain.couponissue.repository;

import com.mycom.myapp.team5.domain.couponissue.entity.CouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface CouponIssueRepository extends JpaRepository<CouponIssue, Long> {

    long countByCouponId(Long couponId);

    @Transactional
    void deleteByCouponId(Long couponId);

    // S012/S013가 쿠폰마다 countByCouponId를 따로 호출하던 N+1을 없애기 위한 배치 집계 쿼리.
    @Query("SELECT ci.couponId AS couponId, COUNT(ci) AS issuedCount " +
            "FROM CouponIssue ci WHERE ci.couponId IN :couponIds GROUP BY ci.couponId")
    List<CouponIssueCount> countGroupedByCouponIds(@Param("couponIds") List<Long> couponIds);

    interface CouponIssueCount {
        Long getCouponId();
        Long getIssuedCount();
    }

}
