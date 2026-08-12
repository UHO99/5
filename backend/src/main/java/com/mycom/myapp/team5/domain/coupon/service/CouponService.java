package com.mycom.myapp.team5.domain.coupon.service;

import com.mycom.myapp.team5.domain.coupon.dto.CouponResponse;

public interface CouponService {

    CouponResponse getExampleById(Long id);

    CouponResponse getCoupon(long couponId);

<<<<<<< HEAD
    int decreaseStock(long couponId);
=======
    int decreaseStockBatch(long couponId, int requestedCount);
>>>>>>> 0cd88f8415108e5931b8ddbade1694bfde48f71a

}
