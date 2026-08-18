package com.mycom.myapp.team5.domain.couponissue.entity;

import com.mycom.myapp.team5.global.common.enums.CouponIssueStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "coupon_issue",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_coupon",
                        columnNames = {"user_id", "coupon_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CouponIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;

    /**
     * 발급 건 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponIssueStatus status;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Builder
    public CouponIssue(Long userId, Long couponId) {
        this.userId = userId;
        this.couponId = couponId;
        this.status = CouponIssueStatus.ISSUED;
        this.issuedAt = LocalDateTime.now();
    }

    public void use() {
        this.status = CouponIssueStatus.USED;
        this.usedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = CouponIssueStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
    }

    public void expire() {
        this.status = CouponIssueStatus.EXPIRED;
        this.expiredAt = LocalDateTime.now();
    }
}
