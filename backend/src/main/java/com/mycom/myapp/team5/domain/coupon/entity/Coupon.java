package com.mycom.myapp.team5.domain.coupon.entity;

import com.mycom.myapp.team5.global.common.enums.CouponStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /**
     * 전체 발급 가능 수량
     */
    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    /**
     * 발급 캠페인 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponStatus status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Coupon(String name, Integer totalQuantity, LocalDateTime startAt, LocalDateTime endAt) {
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = CouponStatus.READY;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void open() {
        this.status = CouponStatus.OPEN;
    }

    public void close() {
        this.status = CouponStatus.CLOSE;
    }
}
