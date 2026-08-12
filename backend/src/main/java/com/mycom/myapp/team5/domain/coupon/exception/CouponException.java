package com.mycom.myapp.team5.domain.coupon.exception;

import com.mycom.myapp.team5.global.exception.BaseException;

public class CouponException extends BaseException {

    public CouponException(CouponErrorCode errorCode) {
        super(errorCode);
    }

}
