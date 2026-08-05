package com.mycom.myapp.team5.domain.example.dto;

import com.mycom.myapp.team5.domain.example.entity.Example;

public record ExampleResponse(
        Long id,
        String name
) {
    public static ExampleResponse from(Example example) {
        return new ExampleResponse(
                example.getId(),
                example.getName()
        );
    }
}
