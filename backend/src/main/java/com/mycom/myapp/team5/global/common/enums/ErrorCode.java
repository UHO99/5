package com.mycom.myapp.team5.global.common.enums;

import org.springframework.http.HttpStatus;

public interface ErrorCode {

    HttpStatus getHttpStatus();
    String getCode();
    String getMessage();

}
