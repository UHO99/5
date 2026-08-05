package com.mycom.myapp.team5.global.common.dto;

public record ApiResponse<T>(
        boolean success,
        T data,
        String message
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> successNoData() {
        return new ApiResponse<>(true, null, null);
    }

}
