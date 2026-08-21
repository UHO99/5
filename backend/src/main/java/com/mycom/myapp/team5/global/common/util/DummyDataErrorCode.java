package com.mycom.myapp.team5.global.common.util;

import com.mycom.myapp.team5.global.common.enums.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum DummyDataErrorCode implements ErrorCode {

    OPEN_COUPON_EXISTS(HttpStatus.CONFLICT, "DD001",
            "진행 중인 OPEN 쿠폰이 있어 더미데이터를 재적재할 수 없습니다. 먼저 CLOSE 하세요.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

}
