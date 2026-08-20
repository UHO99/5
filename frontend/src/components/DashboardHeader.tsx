import type { DashboardVals } from "../hooks/useDashboardSimulation";

export function DashboardHeader({ vals }: { vals: DashboardVals }) {
  return (
    <div className="main-header">
      <div>
        <h1 className="main-title">부하 테스트 모니터링</h1>
        <span className="main-subtitle">
          대규모 트래픽 선착순 쿠폰 발급 시스템 · 최종 갱신 {vals.clockText}
        </span>
      </div>
      <div className="status-pill">
        <div className="status-dot" style={{ background: vals.systemStatusColor }} />
        <span className="status-label">{vals.systemStatusLabel}</span>
      </div>
    </div>
  );
}
