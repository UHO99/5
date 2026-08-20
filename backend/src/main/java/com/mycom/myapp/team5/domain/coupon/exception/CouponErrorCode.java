package com.mycom.myapp.team5.domain.coupon.exception;

import com.mycom.myapp.team5.global.common.enums.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CouponErrorCode implements ErrorCode {

    COUPON_NOT_FOUND(HttpStatus.NOT_FOUND, "CP001", "쿠폰을 찾을 수 없습니다."),
    COUPON_NOT_OPEN(HttpStatus.BAD_REQUEST, "CP002", "쿠폰 미오픈"),
    COUPON_STATUS_CONFLICT(HttpStatus.CONFLICT, "CP003", "쿠폰 상태 전환이 불가"),
    COUPON_INVALID_PERIOD(HttpStatus.BAD_REQUEST, "CP004", "발급 종료 시각은 시작 시각보다 이후여야 합니다."),

    COUPON_ISSUE_DUPLICATE(HttpStatus.CONFLICT, "CI001", "쿠폰 중복 발급"),
    COUPON_ISSUE_NOT_FOUND(HttpStatus.NOT_FOUND, "CI002", "쿠폰 발급 이력이 없습니다."),

    COUPON_INVENTORY_NOT_STOCKED(HttpStatus.NO_CONTENT, "RD001", "재고 미적재"),
    COUPON_SOLD_OUT(HttpStatus.NO_CONTENT, "RD002", "재고 소진"),

    COUPON_STOCK_ISSUE_HISTORY_MISMATCH(HttpStatus.INTERNAL_SERVER_ERROR, "VF001", "재고 <-> 이력 불일치"),

    COUPON_COMMON_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CM001", "입력값 오류");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

}
