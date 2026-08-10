package com.mycom.myapp.team5.global.exception;

import com.mycom.myapp.team5.global.common.enums.CommonErrorCode;
import lombok.Getter;

@Getter
public abstract class BaseException extends RuntimeException {

    private final CommonErrorCode errorCode;

    protected BaseException(CommonErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

}
