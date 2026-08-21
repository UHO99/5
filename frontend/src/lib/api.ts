export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
}

const API_BASE_STORAGE_KEY = "highfive.apiBaseUrl";

// 배포된 정적 빌드(GitHub Pages 등)를 보는 사람이 자기 컴퓨터에서 백엔드를 로컬로 띄워두고 있다는
// 전제로 곧바로 이 주소를 부른다. 브라우저는 https 페이지에서 http://localhost 로 나가는 것을
// mixed-content 차단 예외로 허용하므로 터널 없이도 동작한다 - 단, "배포 링크를 연 사람의 로컬
// 백엔드"만 호출하는 것이라 그 사람 본인 컴퓨터에서 열 때만 의미가 있다(공개 데모용이 아님).
const DEFAULT_LOCAL_BACKEND = "http://localhost:8080";

/**
 * 로컬 dev(`npm run dev`)에서는 vite.config.ts의 server.proxy가 "/api"를 8080으로 넘겨주므로
 * 상대경로만으로 충분하다 - 그래서 그 경우엔 그대로 ""(상대경로)를 쓴다.
 * 반면 GitHub Pages 같은 정적 배포본은 프록시가 없어서, 기본값으로 DEFAULT_LOCAL_BACKEND를
 * 호출한다. `?api=<URL>`을 한 번 넘기면 그 값을 localStorage에 기억해두고 이후 새로고침에도
 * 계속 그 백엔드를 본다(터널 등 다른 백엔드를 가리키고 싶을 때 쓰는 탈출구).
 */
function resolveApiBase(): string {
  if (typeof window === "undefined") return "";

  const fromQuery = new URLSearchParams(window.location.search).get("api");
  if (fromQuery) {
    const normalized = fromQuery.replace(/\/$/, "");
    window.localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
    return normalized;
  }

  const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  if (stored) return stored;

  const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return isLocalDev ? "" : DEFAULT_LOCAL_BACKEND;
}

export const API_BASE = resolveApiBase();

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
  const res = await fetch(`${API_BASE}/api/admin/monitoring/coupons/${couponId}`);

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
  const res = await fetch(`${API_BASE}/api/admin/monitoring/reset`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`지표 초기화 실패 (HTTP ${res.status})`);
  }
}

/**
 * couponId 스트림의 PEL을 강제로 비운다(DB에는 반영 안 됨) - 재시도해도 영원히 실패할 메시지를
 * 명시적으로 포기하는 최후 수단. 성공하면 실제로 ACK된 건수를 반환한다.
 */
export async function drainPendingStream(couponId: number): Promise<number> {
  const res = await fetch(`${API_BASE}/api/admin/monitoring/coupons/${couponId}/stream/drain`, { method: "POST" });
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
  const res = await fetch(`${API_BASE}/api/admin/coupons`);
  if (!res.ok) {
    throw new Error(`쿠폰 목록 조회 실패 (HTTP ${res.status})`);
  }

  const body: ApiResponse<CouponSummary[]> = await res.json();
  if (!body.success || !body.data) {
    throw new Error(body.message ?? "쿠폰 목록 조회 실패");
  }

  return body.data;
}
