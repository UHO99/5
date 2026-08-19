# 1차 MVP 현황 (유스케이스 기준)

> 코드 실제 상태(2026-08-19 기준, `git log` + 소스 분석)를 유스케이스 UID(S/A/U/T)에 매핑한 문서입니다.
> 셀 표기 규칙: `✅ 완료(근거)` / `⚠️ 부분구현(사유)` / `TODO(부재)` / `–` 해당없음(레이어 자체가 필요 없는 유스케이스)

---

## 시스템 (Actor: 시스템)

| UID | 구분 | 유스케이스명 | Entity | Repository | DTO | Service | Controller | Test | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S001 | 재고 관리 | Redis 재고 사전 적재 | – | – | – | ⚠️ `CouponStatusServiceImpl#openCoupon`(OPEN 전환 즉시 initStock) + `CouponStatusScheduler#replenishMissingStock`(60초 보정) | – | ⚠️ `CouponStatusServiceTest`(간접) | ⚠️ 부분구현 — 스펙상 "사전(이벤트 전 미리) 적재"가 아니라 "OPEN 전환 시 즉시 적재 + 이후 60초 주기 보정"으로 구현됨. 별도 사전 push 배치는 없음 |
| S002 | 재고 관리 | Redis 재고 확인 및 원자적 차감 | – | – | – | ✅ `CouponStockRedisService`(Lua `ISSUE_SCRIPT`) | – (Producer 경유) | ✅ `CouponIssueStreamProducerTest` | 완료 |
| S003 | 쿠폰 발급 | 중복 발급 여부 확인 | – | – | – | ✅ 같은 Lua 스크립트 내 `sismember` 체크(S002와 원자적으로 통합) | – | ✅ `CouponIssueStreamProducerTest`(중복 케이스) | 완료 |
| S004 | 쿠폰 발급 | 발급 성공 처리 | – | – | – | ✅ `CouponStockRedisService#issue` 성공 경로 | ✅ `CouponController#requestIssue`(202 Accepted) | ✅ `CouponIssueStreamProducerTest` | 완료 |
| S005 | 쿠폰 발급 | 발급 실패 처리(품절/오류) | ✅ `CouponErrorCode`(SOLD_OUT/DUPLICATE/NOT_STOCKED) | – | – | ✅ `CouponStockRedisService#issue` 예외 분기 | ✅ `GlobalExceptionHandler` | ✅ `CouponIssueStreamProducerTest` | 완료 |
| S006 | 쿠폰 발급 | 발급 이벤트 저장(Stream 적재) | – | – | – | ✅ `CouponIssueStreamProducer`(XADD) | – | ✅ `CouponIssueStreamProducerTest` | 완료 |
| S007 | 이력 관리 | Redis Stream 기반 배치 Insert | ✅ `CouponIssue` | – (JdbcTemplate 직접 사용) | – | ✅ `CouponIssueStreamConsumer`(buffer+flush 스레드, batch insert) | – | ⚠️ 전용 유닛테스트 없음(`CouponStockValidationServiceTest`가 결과만 간접 검증) | 부분구현 — 로직은 완료, Consumer 자체를 겨냥한 테스트가 없음 |
| S008 | 이력 관리 | 개인정보 마스킹 | – | – | ✅ `UserResponse.from()`(마스킹 적용) | ✅ `MaskingUtils` + `LoggingAspect`(AOP, 로그 마스킹) | – | ✅ `MaskingUtilsTest` | 완료 |
| S009 | 쿠폰 관리 | 쿠폰 상태 전환(READY→OPEN→CLOSE) | ✅ `Coupon#open()/close()`, `CouponStatus` | ✅ `CouponRepository#findByIdForUpdate` | – | ✅ `CouponStatusServiceImpl` | ✅ `CouponController` open/close | ✅ `CouponStatusServiceTest` | 완료 |
| S010 | 쿠폰 관리 | 쿠폰 발급 시작 스케줄링(자동 OPEN) | – | ✅ `findByStatusAndStartAtLessThanEqual` | – | ✅ `CouponStatusScheduler#autoOpen` | – | ✅ `CouponStatusSchedulerTest` | 완료 |
| S011 | 쿠폰 관리 | 쿠폰 발급 종료 스케줄링(자동 CLOSE) | – | ✅ `findByStatusAndEndAtLessThanEqual` | – | ✅ `CouponStatusScheduler#autoClose` | – | ✅ `CouponStatusSchedulerTest` | 완료 |
| S012 | 정합성 | 정합성 동기화 | ✅ `Coupon#issuedQuantity` | ✅ `findByStatusAndIssuedQuantityIsNull`, `CouponIssueRepository#countGroupedByCouponIds` | – | ✅ `CouponStockSyncService` | – | ⚠️ 전용 테스트 없음(간접적으로 `CouponStockValidationServiceTest`가 커버) | 완료 |
| S013 | 정합성 | 데이터 정합성 검증 배치 | ✅ `Coupon#consistencyConfirmedAt` | ✅ `findByStatusAndConsistencyConfirmedAtIsNull` | – | ✅ `CouponStockValidationService`, `CouponMismatchReport`, `MismatchNotifier` | – | ✅ `CouponStockValidationServiceTest` | 완료 |
| S014 | 인프라 | 스키마 Migration | – | – | – | ✅ Flyway `V1~V9` (`db/migration/*.sql`) | – | TODO (별도 마이그레이션 검증 테스트 없음) | 완료(운영 측면) |

---

## 관리자 (Actor: Admin)

| UID | 구분 | 유스케이스명 | Entity | Repository | DTO | Service | Controller | Test | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A001 | 데이터 관리 | 가상 발급 내역 생성 및 적재 | 재사용(`Coupon`, `CouponIssue`) | – (CSV `LOAD DATA LOCAL INFILE` 직접 사용) | – | ⚠️ `CouponDummyGenerator#main()` — Spring Bean이 아닌 **수동 실행 스크립트** | 없음(관리자 API 아님) | 없음(자체 `verify()` 콘솔 체크만) | 부분구현 — API가 아니라 로컬 실행용 배치 도구 |
| A002 | 데이터 관리 | 가상 회원 정보 적재 | 재사용(`User`) | – | – | ⚠️ `DummyDataGenerator#main()` (A001과 동일 방식) | 없음 | 없음 | 부분구현 — 동일 |
| A003 | 쿠폰 관리 | 쿠폰 생성 및 재고 설정 | ✅ `Coupon` 엔티티 자체는 있음 | ✅ `save()`(JpaRepository 기본) | ⚠️ `CouponRequest` 정의만 있고 연결 안 됨 | TODO | TODO(생성 endpoint 없음) | TODO | **TODO — 관리자 쿠폰 생성 API 자체가 없음** |
| A004 | 쿠폰 관리 | 쿠폰 재고/기간 설정 | ✅ `totalQuantity/startAt/endAt` 필드는 있음 | TODO(수정 쿼리 없음) | TODO | TODO | TODO(수정 endpoint 없음) | TODO | **TODO — 수정 API 없음** |
| A005 | 쿠폰 관리 | 쿠폰 현황 조회(잔여 수량/발급 건수) | ✅ `issuedQuantity` 필드는 존재 | ✅ 조회 가능 | ⚠️ `CouponResponse`는 `totalQuantity`만 노출(잔여/발급건수 없음) | – | ⚠️ `CouponController#getStock`(단건, 잔여량 미포함), `#getCouponStatus`(상태값만) | TODO | 부분구현 — 잔여수량·발급건수를 한 번에 보여주는 관리자 조회 API 없음 |

---

## 사용자 (Actor: Client)

| UID | 구분 | 유스케이스명 | Entity | Repository | DTO | Service | Controller | Test | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| U001 | 쿠폰 조회 | 쿠폰 목록/상세 조회 | ✅ `Coupon` | ✅ | ✅ `CouponResponse`(상세용) | ✅ `CouponServiceImpl#getCoupon` | ⚠️ 단건 상세(`GET /{couponId}`)만 있음 | TODO | 부분구현 — **목록 조회 API 없음**, 상세만 가능 |
| U002 | 쿠폰 발급 | 쿠폰 발급 요청 | (S003~S006과 동일) | | | | ✅ `CouponController#requestIssue` | ✅ | 완료 |
| U003 | 이력 조회 | 본인 쿠폰 상세/상태 조회 | ✅ `CouponIssue`(상태 enum 존재: `ISSUED/USED/CANCELED/EXPIRED`) | ⚠️ 사용자별 조회 메서드 없음(`countByCouponId`뿐) | TODO | TODO | TODO | TODO | **TODO — 미구현** |
| U004 | 쿠폰 사용 | 쿠폰 사용/취소 요청 | ⚠️ `CouponIssue#use()/cancel()` 메서드는 존재 | – | TODO | TODO(호출부 없음) | TODO | TODO | **TODO — 도메인 메서드만 있고 호출 경로가 전혀 없음** |

> U003 스펙의 상태값 표기(`READY/사용/취소/만료`)와 실제 엔티티 enum(`ISSUED/USED/CANCELED/EXPIRED`)이 다릅니다. 구현 시 용어를 통일하세요.

---

## 성능 테스터 (Actor: T)

| UID | 구분 | 유스케이스명 | 근거 | 상태 |
| --- | --- | --- | --- | --- |
| T001 | 부하 테스트 | 대량 발급 부하 테스트 | ✅ k6(`k6/api_test.js`, `redis_test.js`, `kafka_test.js`) + JUnit 벤치마크(`CrudConcurrencyTest`, `RedisConcurrencyTest`, `RedisBatchConcurrencyTest`, `KafkaConcurrencyTest`, `KafkaDBIOTest`, `KafkaContainerTest`) | 완료 |
| T002 | 부하 테스트 | 동시성 초과 발급 검증 | ✅ `RedisConcurrencyTest`(십만 명 동시 요청 시 재고 정확히 소진), `CrudConcurrencyTest`(동일 시나리오 CRUD 버전), `CouponStatusServiceTest`(OPEN 10건 동시 요청 시 1건만 성공) | 완료 |

---

## 구분별 완료율 요약

| 구분 | 완료 | 부분구현 | TODO |
| --- | --- | --- | --- |
| 재고 관리 (S001, S002, S012, S013) | 3 | 1 (S001) | 0 |
| 쿠폰 발급 (S003~S006, U002) | 5 | 0 | 0 |
| 이력 관리 (S007, S008) | 1 (S008) | 1 (S007, 테스트만 부재) | 0 |
| 쿠폰 관리 (S009~S011) | 3 | 0 | 0 |
| 인프라 (S014) | 1 | 0 | 0 |
| 데이터 관리 (A001, A002) | 0 | 2 | 0 |
| 쿠폰 관리 - 관리자 (A003~A005) | 0 | 1 (A005) | 2 (A003, A004) |
| 쿠폰 조회 (U001) | 0 | 1 | 0 |
| 이력 조회 / 쿠폰 사용 (U003, U004) | 0 | 0 | 2 |
| 부하 테스트 (T001, T002) | 2 | 0 | 0 |

**핵심 결론**: 시스템(S) 유스케이스는 사실상 완료 상태(S001, S007 테스트 보완만 남음). **관리자의 쿠폰 CRUD(A003/A004)와 사용자의 이력 조회·사용/취소(U003/U004)가 1차 MVP의 실질적인 블로커**입니다. 지금은 쿠폰이 더미 데이터로만 존재하고, 발급받은 쿠폰을 사용자가 조회하거나 사용할 방법이 없습니다.

---

## TODO (우선순위 순)

**High — MVP 완료 블로커**
- [ ]  A003: 쿠폰 생성 API (`POST /api/admin/coupons`) — `CouponRequest` 연결
- [ ]  A004: 쿠폰 재고/기간 수정 API (`PATCH /api/admin/coupons/{id}`)
- [ ]  U003: 본인 발급 쿠폰 목록/상태 조회 API
- [ ]  U004: 쿠폰 사용/취소 API — `CouponIssue#use()/cancel()` 연결

**Medium**
- [ ]  U001: 쿠폰 목록 조회 API (`GET /coupons`)
- [ ]  A005: 관리자용 쿠폰 현황(잔여수량+발급건수) 조회 API
- [ ]  S001: "사전 적재"라는 스펙 표현과 실제 구현(OPEN 시 즉시 적재) 간 괴리 — 스펙을 실제 구현에 맞게 수정하거나, 진짜 사전 적재 배치를 추가할지 논의
- [ ]  S007: `CouponIssueStreamConsumer` 전용 테스트 추가

**Low**
- [ ]  `CouponService.getExampleById` 삭제(미사용 예제 코드)
- [ ]  A001/A002를 관리자 API로 승격할지, 로컬 스크립트로 유지할지 결정 (현재는 서버 끄고 수동 실행하는 방식)
- [ ]  `global/kafka` 패키지(S007의 대안 경로, `app.kafka.enabled=false` 기본 비활성)를 벤치마크 결과 문서화 후 정리할지 결정

---

## 완료 기준

- [ ]  38개 유스케이스(S/A/U/T) 전부 Entity~Test까지 매핑됨 — **A003/A004/U003/U004 미구현으로 미충족**
- [x]  시스템(S) 유스케이스는 테스트로 대부분 커버됨 — S001(간접), S007(간접) 보완 필요
- [ ]  API 명세와 실제 응답이 일치함 — 별도 API 문서(Swagger 등) 존재 여부 확인 필요
- [x]  리팩토링/TODO 항목이 우선순위와 함께 문서화됨 — 위 표 참고
- [ ]  1차 MVP 범위가 완료됨 — **관리자 쿠폰 CRUD, 사용자 이력 조회/사용 4개 유스케이스가 남아있어 미완료**
