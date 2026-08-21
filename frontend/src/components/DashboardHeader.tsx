import type { DashboardVals } from "../hooks/useMonitoringDashboard";
import type { CouponSummary } from "../lib/api";

const STATUS_LABEL: Record<CouponSummary["status"], string> = {
  READY: "대기",
  OPEN: "오픈",
  CLOSE: "마감",
};

interface Props {
  vals: DashboardVals;
  error?: string | null;
  coupons: CouponSummary[];
  couponId: number;
  onCouponChange: (couponId: number) => void;
  loadingData: boolean;
}

export function DashboardHeader({ vals, error, coupons, couponId, onCouponChange, loadingData }: Props) {
  return (
    <div className="main-header">
      <div>
        <h1 className="main-title">부하 테스트 모니터링</h1>
        <span className="main-subtitle">
          대규모 트래픽 선착순 쿠폰 발급 시스템 · 최종 갱신 {vals.clockText}
          {error && <span style={{ color: "#dc2626" }}> · 백엔드 연결 실패 ({error})</span>}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          className="coupon-select"
          value={couponId}
          onChange={(e) => onCouponChange(Number(e.target.value))}
          aria-label="모니터링할 쿠폰 선택"
        >
          {coupons.length === 0 && <option value={couponId}>#{couponId}</option>}
          {coupons.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.id} · {c.name} · {STATUS_LABEL[c.status]}
            </option>
          ))}
        </select>

        {loadingData && (
          <div className="status-pill">
            <div className="status-dot" style={{ background: "#f59e0b" }} />
            <span className="status-label">데이터 적재 중</span>
          </div>
        )}

        <div className="status-pill">
          <div className="status-dot" style={{ background: vals.systemStatusColor }} />
          <span className="status-label">{vals.systemStatusLabel}</span>
        </div>
      </div>
    </div>
  );
}
