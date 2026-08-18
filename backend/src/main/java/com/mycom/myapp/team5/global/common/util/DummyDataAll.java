package com.mycom.myapp.team5.global.common.util;

/**
 * 더미데이터 일괄 생성 (수동 실행)
 * users → coupon/coupon_issue 순서로 실행한다.
 * coupon_issue 가 users 를 FK 로 참조하므로 이 순서를 지켜야 한다.
 * 사전 조건
 * 1) 테이블이 있는 상태에서 실행
 * ex)한 번 실행해 Flyway 로 테이블을 만든 뒤 종료
 *    (서버가 켜진 채로 실행하면 안 됨 — 백그라운드 스케줄러가 같은 테이블을
 *     동시에 건드려 TRUNCATE 와 충돌할 수 있다)
 * 2) MySQL              : SET GLOBAL local_infile = 1;
 * 3) application-dev.properties 의 url : ...&amp;allowLoadLocalInfile=true
 * 회원만, 또는 쿠폰만 다시 만들고 싶으면
 * {@link DummyDataGenerator} 또는 {@link CouponDummyGenerator} 를 각각 실행해도 된다.
 */
public class DummyDataAll {

    public static void main(String[] args) throws Exception {
        System.out.println("========== 1) 회원 더미데이터 ==========");
        DummyDataGenerator.main(args);

        System.out.println();
        System.out.println("========== 2) 쿠폰 / 발급 이력 더미데이터 ==========");
        CouponDummyGenerator.main(args);
    }
}
