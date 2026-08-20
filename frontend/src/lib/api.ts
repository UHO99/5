export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

/** backend MonitoringDashboardResponse(domain/monitoring/dto)와 1:1로 대응한다. */
export interface MonitoringDashboardResponse {
  couponId: number;
  measuredAt: string;
  serverResources: {
    rps: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    jvmHeapUsagePercent: number;
  };
  apiResponse: {
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    p99ResponseTimeMs: number;
    errorRatePercent: number;
    successAvgResponseTimeMs: number;
    failAvgResponseTimeMs: number;
  };
  couponIssueStatus: {
    totalRequests: number;
    successCount: number;
    failCount: number;
    issuePerSecond: number;
    soldOutFailCount: number;
    duplicateFailCount: number;
  };
  overIssueMonitor: {
    stockDepletedCount: number;
    successIssuedCount: number;
    dbHistoryCount: number;
    matched: boolean;
    /** S012(정합성 동기화)가 마지막으로 기록한 값 - 아직 한 번도 동기화 안 됐으면 null. */
    recordedIssuedQuantity: number | null;
    /** S013(정합성 검증)이 드레인 완료 + 기록값=실측값을 확정했는지. */
    consistencyConfirmed: boolean;
  };
  stockStatus: {
    issuedCount: number;
    redisStockRemaining: number;
    redisStockTotal: number;
    redisStockConsumedPercent: number;
  };
  streamStatus: {
    activeSubscriptions: number;
    totalStreams: number;
    pendingCount: number;
    maxLagMs: number;
  };
  dbStorage: {
    dbConnPoolActive: number;
    dbConnPoolMax: number;
    dbInsertThroughputPerSecond: number;
    batchInsertAvgSize: number;
    batchInsertMaxSize: number;
  };
}

export async function fetchMonitoringDashboard(couponId: number): Promise<MonitoringDashboardResponse> {
  const res = await fetch(`/api/admin/monitoring/coupons/${couponId}`);

  if (!res.ok) {
    throw new Error(`모니터링 조회 실패 (HTTP ${res.status})`);
  }

  const body: ApiResponse<MonitoringDashboardResponse> = await res.json();
  if (!body.success || !body.data) {
    throw new Error(body.message ?? "모니터링 조회 실패");
  }

  return body.data;
}

/** 대시보드 지표(HTTP/발급/DB insert 집계)만 0으로 되돌린다 - Redis/DB 실 데이터는 그대로 유지. */
export async function resetMonitoringMetrics(): Promise<void> {
  const res = await fetch("/api/admin/monitoring/reset", { method: "POST" });
  if (!res.ok) {
    throw new Error(`지표 초기화 실패 (HTTP ${res.status})`);
  }
}

/**
 * couponId 스트림의 PEL을 강제로 비운다(DB에는 반영 안 됨) - 재시도해도 영원히 실패할 메시지를
 * 명시적으로 포기하는 최후 수단. 성공하면 실제로 ACK된 건수를 반환한다.
 */
export async function drainPendingStream(couponId: number): Promise<number> {
  const res = await fetch(`/api/admin/monitoring/coupons/${couponId}/stream/drain`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`PEL 드레인 실패 (HTTP ${res.status})`);
  }

  const body: ApiResponse<number> = await res.json();
  if (!body.success || body.data === null) {
    throw new Error(body.message ?? "PEL 드레인 실패");
  }

  return body.data;
}

export type CouponStatus = "READY" | "OPEN" | "CLOSE";

export interface CouponSummary {
  id: number;
  name: string;
  status: CouponStatus;
  totalQuantity: number;
}

export async function fetchCoupons(): Promise<CouponSummary[]> {
  const res = await fetch("/api/admin/coupons");
  if (!res.ok) {
    throw new Error(`쿠폰 목록 조회 실패 (HTTP ${res.status})`);
  }

  const body: ApiResponse<CouponSummary[]> = await res.json();
  if (!body.success || !body.data) {
    throw new Error(body.message ?? "쿠폰 목록 조회 실패");
  }

  return body.data;
}
