// MVP 1차 시나리오 4 : 소규모 동시 요청 (기능 검증용)
// 한정된 재고에 여러 유저가 동시에 발급을 요청했을 때 초과 발급이 없는지 확인한다.
// 성능 측정이 목적이 아니므로 규모를 작게 두고, "성공 건수 == 재고 수량" 만 본다.
//
// 사전 준비
//   1) 서버 실행
//   2) 테스트용 쿠폰을 STOCK 값과 동일한 재고로 OPEN
//        POST /api/admin/coupons/{COUPON_ID}/open
//   3) coupon_issue 에 해당 쿠폰의 기존 발급 이력이 없는지 확인
//        (있으면 SISMEMBER 중복 체크에 걸려 결과가 왜곡됨)
//
// 실행
//   k6 run backend/k6/small-scale-concurrency.js
//   k6 run -e COUPON_ID=5 -e STOCK=20 backend/k6/small-scale-concurrency.js

import http from 'k6/http';
import { Counter } from 'k6/metrics';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const COUPON_ID = __ENV.COUPON_ID || '1';
const STOCK = Number(__ENV.STOCK || 20);
// 더미 유저 수. users 테이블에 실제로 존재하는 id 범위(1 ~ USER_COUNT)
const USER_COUNT = Number(__ENV.USER_COUNT || 1_000_000);

// 재고의 2배를 요청해 "초과 요청 상황"을 실제로 만든다.
const REQUEST_COUNT = STOCK * 2;

const issued    = new Counter('issue_success');    // 202
const soldOut   = new Counter('issue_sold_out');    // 204 RD002
const notStocked = new Counter('issue_not_stocked'); // 204 RD001 (오픈 안 하고 실행한 경우)
const notOpen   = new Counter('issue_not_open');    // 400 CP002
const duplicate = new Counter('issue_duplicate');   // 409 CI001 (원래는 안 나와야 함 - 유저가 전부 다르므로)
const unexpected = new Counter('issue_unexpected');

export const options = {
  scenarios: {
    small_scale_concurrency: {
      executor: 'shared-iterations',   // REQUEST_COUNT 번이 정확히 실행되도록 보장
      vus: Math.min(REQUEST_COUNT, 50),
      iterations: REQUEST_COUNT,
      maxDuration: '30s',
    },
  },
};

export default function () {
  // 매 요청마다 서로 다른 유저 (users id: 1 ~ USER_COUNT)
  const userId = (exec.scenario.iterationInTest % USER_COUNT) + 1;

  const res = http.post(`${BASE_URL}/coupons/${COUPON_ID}/issue?userId=${userId}`);

  switch (res.status) {
    case 202: issued.add(1); break;
    case 204:
      if (res.body && res.body.includes('RD001')) notStocked.add(1);
      else soldOut.add(1);
      break;
    case 400: notOpen.add(1); break;
    case 409: duplicate.add(1); break;
    default:
      unexpected.add(1);
      console.error(`예상 못한 응답: ${res.status} ${res.body}`);
  }
}

export function teardown() {
  console.log('');
  console.log('== 판정 기준 ==');
  console.log(`재고(STOCK) = ${STOCK} 이면, issue_success 카운터가 정확히 ${STOCK} 이어야 정상.`);
  console.log('그 외 요청은 전부 issue_sold_out 이어야 하고, issue_duplicate / issue_unexpected 는 0이어야 함.');
  console.log('실행 후 아래도 함께 확인:');
  console.log(`  redis-cli GET coupon:stock:${COUPON_ID}         -> 0 이어야 함`);
  console.log(`  redis-cli SMEMBERS coupon:issued:${COUPON_ID}   -> ${STOCK}명이어야 함`);
  console.log(`  SELECT COUNT(*) FROM coupon_issue WHERE coupon_id=${COUPON_ID}; -> ${STOCK} (비동기 반영, 몇 초 대기 후 확인)`);
}
