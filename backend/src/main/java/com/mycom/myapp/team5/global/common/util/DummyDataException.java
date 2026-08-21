package com.mycom.myapp.team5.global.common.util;

import com.mycom.myapp.team5.global.exception.BaseException;

public class DummyDataException extends BaseException {

    public DummyDataException(DummyDataErrorCode errorCode) {
        super(errorCode);
    }

}
