import type { DashboardVals } from "../hooks/useMonitoringDashboard";
import type { DummyDataCounts } from "../lib/api";

const FMT = new Intl.NumberFormat("ko-KR");

interface Props {
  vals: DashboardVals;
  dummyDataCounts: DummyDataCounts | null;
}

export function DbStorageCard({ vals, dummyDataCounts }: Props) {
  return (
    <div className="card">
      <span className="card-title">DB 저장</span>

      <div className="tile-grid-2">
        <div className="tile">
          <div className="tile-label-md">DB Conn Pool</div>
          <div className="tile-value-sm" style={{ color: vals.dbConnColor }}>
            {vals.dbConnFmt}
          </div>
        </div>
        <div className="tile">
          <div className="tile-label-md">DB Insert 처리량</div>
          <div className="tile-value-sm" style={{ color: "#171b2e" }}>
            {vals.dbInsertFmt}
          </div>
        </div>
      </div>

      <span className="section-label">Batch Insert 크기 분포 (상한 500건)</span>
      <div className="latency-rows">
        <div className="latency-line">
          <span className="latency-tag">평균</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ background: "#5b6bd6", width: vals.batchAvgPct }} />
          </div>
          <span className="latency-value">{vals.batchAvgFmt}</span>
        </div>
        <div className="latency-line">
          <span className="latency-tag">최대</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ background: "#171b2e", width: vals.batchMaxPct }} />
          </div>
          <span className="latency-value">{vals.batchMaxFmt}</span>
        </div>
      </div>

      <span className="section-label">더미데이터 적재 현황</span>
      {dummyDataCounts === null ? (
        <span className="tile-label-md">기록 없음</span>
      ) : (
        <div className="tile-grid-3">
          <div className="tile tile-sm">
            <div className="tile-label-xs">회원</div>
            <div className="tile-value-xs">{FMT.format(dummyDataCounts.userCount)}</div>
          </div>
          <div className="tile tile-sm">
            <div className="tile-label-xs">쿠폰</div>
            <div className="tile-value-xs">{FMT.format(dummyDataCounts.couponCount)}</div>
          </div>
          <div className="tile tile-sm">
            <div className="tile-label-xs">발급 이력</div>
            <div className="tile-value-xs">{FMT.format(dummyDataCounts.couponIssueCount)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
