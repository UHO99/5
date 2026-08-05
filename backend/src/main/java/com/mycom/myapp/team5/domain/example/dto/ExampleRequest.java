package com.mycom.myapp.team5.domain.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExampleRequest(
    @NotBlank(message = "이름 필수")
    @Size(max = 20, message = "이름 20자 이하")
    String name
) {}
