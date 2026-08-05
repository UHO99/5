package com.mycom.myapp.team5.domain.example.exception;

import com.mycom.myapp.team5.global.common.enums.ErrorCode;
import com.mycom.myapp.team5.global.exception.BaseException;

public class ExampleNotFoundException extends BaseException {

    public ExampleNotFoundException(String message) {
        super(ErrorCode.EXAMPLE_NOT_FOUN);
    }

}
