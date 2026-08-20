import { useState } from "react";
import { K6_SCENARIOS, type K6Scenario } from "../lib/scenarios";

interface Props {
  onCancel: () => void;
  onConfirm: (scenario: K6Scenario) => void;
}

export function ScenarioDialog({ onCancel, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState(K6_SCENARIOS[0].id);

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">K6 부하테스트 시나리오 선택</h2>
          <span className="dialog-subtitle">backend/k6 에 있는 스크립트 중 하나를 골라 실행합니다.</span>
        </div>

        <div className="scenario-list">
          {K6_SCENARIOS.map((scenario) => (
            <label
              key={scenario.id}
              className={`scenario-item ${selectedId === scenario.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="scenario"
                value={scenario.id}
                checked={selectedId === scenario.id}
                onChange={() => setSelectedId(scenario.id)}
                className="scenario-radio"
              />
              <div className="scenario-body">
                <div className="scenario-name-row">
                  <span className="scenario-name">{scenario.name}</span>
                  <span className="scenario-file">{scenario.file}</span>
                </div>
                <span className="scenario-description">{scenario.description}</span>
                <div className="scenario-meta">
                  <span>램프업 {scenario.rampUp}</span>
                  <span>유지 {scenario.hold}</span>
                  <span>{scenario.targetVus}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="dialog-actions">
          <button type="button" className="dialog-btn ghost" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="dialog-btn primary"
            onClick={() => {
              const scenario = K6_SCENARIOS.find((s) => s.id === selectedId)!;
              onConfirm(scenario);
            }}
          >
            실행
          </button>
        </div>
      </div>
    </div>
  );
}
