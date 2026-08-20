import { useState } from "react";
import type { DashboardVals } from "../hooks/useMonitoringDashboard";
import type { K6Scenario } from "../lib/scenarios";
import { ScenarioDialog } from "./ScenarioDialog";

interface Props {
  vals: DashboardVals;
  activeScenario: K6Scenario | null;
  onStartTest: (scenario: K6Scenario) => void;
  onStopTest: () => void;
  onLoadData: () => void;
  onResetMetrics: () => void;
}

export function FloatingActionMenu({ vals, activeScenario, onStartTest, onStopTest, onLoadData, onResetMetrics }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTestButtonClick = () => {
    setMenuOpen(false);
    if (vals.testRunning) {
      onStopTest();
    } else {
      setDialogOpen(true);
    }
  };

  const testButtonText = vals.testRunning
    ? `${vals.testButtonLabel} · ${activeScenario ? `${activeScenario.file} · ` : ""}${vals.elapsedText}`
    : vals.testButtonLabel;

  return (
    <>
      <div className="fab-container">
        <button
          type="button"
          aria-label="메뉴"
          aria-expanded={menuOpen}
          className={`fab-main ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="fab-icon">+</span>
          {vals.testRunning && <span className="fab-badge" />}
        </button>

        {menuOpen && (
          <div className="fab-menu">
            <button
              type="button"
              className="fab-action"
              onClick={() => {
                onLoadData();
                setMenuOpen(false);
              }}
            >
              데이터 적재
            </button>
            <button
              type="button"
              className="fab-action"
              onClick={() => {
                onResetMetrics();
                setMenuOpen(false);
              }}
            >
              지표 초기화
            </button>
            <button
              type="button"
              className={`fab-action primary ${vals.testRunning ? "running" : "idle"}`}
              onClick={handleTestButtonClick}
            >
              {testButtonText}
            </button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <ScenarioDialog
          onCancel={() => setDialogOpen(false)}
          onConfirm={(scenario) => {
            setDialogOpen(false);
            onStartTest(scenario);
          }}
        />
      )}
    </>
  );
}
