package com.mycom.myapp.team5.domain.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CouponRequest(
    @NotBlank(message = "이름 필수")
    @Size(max = 20, message = "이름 20자 이하")
    String name
) {}
