/**
 * backend/k6/*.js 에 실제로 존재하는 시나리오 스크립트 목록.
 * 세 스크립트 모두 같은 발급 엔드포인트(POST /{couponId}/issue)를 때리며,
 * 과거에 백엔드 구현체(CRUD/Kafka/Redis Stream)를 비교하던 시절 이름이 그대로 남아있다.
 * TODO(API 연동): 지금은 선택만 할 뿐 실제로 k6를 실행하지 않는다 - 시작을 누르면
 * 대시보드 목데이터 시뮬레이션(LOAD 기준값)으로 전환될 뿐이다.
 */
export interface K6Scenario {
  id: string;
  file: string;
  name: string;
  description: string;
  rampUp: string;
  hold: string;
  targetVus: string;
}

export const K6_SCENARIOS: K6Scenario[] = [
  {
    id: "api",
    file: "api_test.js",
    name: "기본 발급 API 부하테스트",
    description: "발급 엔드포인트의 요청 수락 속도를 측정하는 표준 시나리오.",
    rampUp: "10s",
    hold: "30s",
    targetVus: "20,000 VU",
  },
  {
    id: "redis",
    file: "redis_test.js",
    name: "Redis Stream 파이프라인",
    description: "Redis Stream 기반 배치 insert 경로 대상. 램프업을 완만하게(30s) 잡아 초반 튐을 줄인다.",
    rampUp: "30s",
    hold: "30s",
    targetVus: "20,000 VU",
  },
  {
    id: "kafka",
    file: "kafka_test.js",
    name: "Kafka 비교 시나리오",
    description: "초기에 Kafka 기반 구현과 비교하려고 만든 시나리오 (현재 운영 경로는 Redis Stream).",
    rampUp: "10s",
    hold: "30s",
    targetVus: "20,000 VU",
  },
];
