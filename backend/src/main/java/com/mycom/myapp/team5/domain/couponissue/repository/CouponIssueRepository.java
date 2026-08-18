package com.mycom.myapp.team5.domain.couponissue.repository;

import com.mycom.myapp.team5.domain.couponissue.entity.CouponIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface CouponIssueRepository extends JpaRepository<CouponIssue, Long> {

    long countByCouponId(Long couponId);

    @Transactional
    void deleteByCouponId(Long couponId);

}
