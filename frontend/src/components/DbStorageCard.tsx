import type { DashboardVals } from "../hooks/useDashboardSimulation";

export function DbStorageCard({ vals }: { vals: DashboardVals }) {
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
    </div>
  );
}
