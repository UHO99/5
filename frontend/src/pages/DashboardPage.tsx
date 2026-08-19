import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { ServerResourceCard } from "../components/ServerResourceCard";
import { ApiResponseCard } from "../components/ApiResponseCard";
import { CouponStatusCard } from "../components/CouponStatusCard";
import { RedisStockCard } from "../components/RedisStockCard";
import { DbStorageCard } from "../components/DbStorageCard";
import { FloatingActionMenu } from "../components/FloatingActionMenu";
import { useDashboardSimulation } from "../hooks/useDashboardSimulation";
import type { K6Scenario } from "../lib/scenarios";

export function DashboardPage() {
  const { vals, toggleTest } = useDashboardSimulation();
  const [activeScenario, setActiveScenario] = useState<K6Scenario | null>(null);

  // TODO(API 연동): 실제로는 선택한 스크립트로 k6를 실행하는 API를 호출해야 한다.
  // 지금은 대시보드 목데이터 시뮬레이션(LOAD 기준값)을 켜는 스위치일 뿐이다.
  const handleStartTest = (scenario: K6Scenario) => {
    setActiveScenario(scenario);
    toggleTest();
  };

  const handleStopTest = () => {
    toggleTest();
    setActiveScenario(null);
  };

  // TODO(API 연동): 실제 더미데이터 적재 API(A001/A002)를 붙일 자리.
  const handleLoadData = () => {
    console.info("[HighFive] 데이터 적재 요청 - API 연동 전이라 아직 아무 동작도 하지 않습니다.");
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main">
        <DashboardHeader vals={vals} />

        <div className="row">
          <ServerResourceCard vals={vals} />
          <ApiResponseCard vals={vals} />
          <CouponStatusCard vals={vals} />
        </div>

        <div className="row">
          <RedisStockCard vals={vals} />
          <DbStorageCard vals={vals} />
        </div>
      </div>

      <FloatingActionMenu
        vals={vals}
        activeScenario={activeScenario}
        onStartTest={handleStartTest}
        onStopTest={handleStopTest}
        onLoadData={handleLoadData}
      />
    </div>
  );
}
