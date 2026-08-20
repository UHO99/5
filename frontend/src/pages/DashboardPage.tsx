import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { DashboardHeader } from "../components/DashboardHeader";
import { ServerResourceCard } from "../components/ServerResourceCard";
import { ApiResponseCard } from "../components/ApiResponseCard";
import { CouponStatusCard } from "../components/CouponStatusCard";
import { RedisStockCard } from "../components/RedisStockCard";
import { DbStorageCard } from "../components/DbStorageCard";
import { FloatingActionMenu } from "../components/FloatingActionMenu";
import { useMonitoringDashboard } from "../hooks/useMonitoringDashboard";
import { drainPendingStream, fetchCoupons, resetMonitoringMetrics, type CouponSummary } from "../lib/api";
import type { K6Scenario } from "../lib/scenarios";

const DEFAULT_COUPON_ID = 1;
const COUPON_LIST_POLL_INTERVAL_MS = 10_000;

export function DashboardPage() {
  const [coupons, setCoupons] = useState<CouponSummary[]>([]);
  const [couponId, setCouponId] = useState(DEFAULT_COUPON_ID);
  const { vals, toggleTest, error } = useMonitoringDashboard(couponId);
  const [activeScenario, setActiveScenario] = useState<K6Scenario | null>(null);

  // 쿠폰 목록은 자주 안 바뀌니 대시보드 지표(2초)보다 느슨하게 폴링한다 - 새 쿠폰이 열리면
  // 선택지에 곧 나타난다.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchCoupons()
        .then((list) => {
          if (cancelled) return;
          setCoupons(list);
          // 지금 보고 있는 쿠폰이 목록에서 사라졌으면(드문 케이스) 첫 쿠폰으로 넘어간다.
          setCouponId((current) =>
            list.some((c) => c.id === current) ? current : (list[0]?.id ?? current)
          );
        })
        .catch(() => {
          // 목록 조회 실패는 별도 에러 UI 없이 조용히 넘어간다 - 대시보드 헤더의
          // 연결 실패 표시가 이미 같은 원인(백엔드 다운)을 알려준다.
        });
    };
    load();
    const timer = window.setInterval(load, COUPON_LIST_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // TODO(k6 연동): 실제로는 선택한 스크립트로 k6를 실행하는 API를 호출해야 한다.
  // 지금은 경과시간 표시용 로컬 상태를 켜는 스위치일 뿐이고, 지표(vals)는 이 상태와
  // 무관하게 항상 실 백엔드 값을 폴링해서 보여준다.
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

  // 대시보드 지표(HTTP/발급/DB insert 집계)만 0으로 되돌린다. Redis 재고·Stream·DB의 실 데이터는
  // 건드리지 않는다 - 예를 들어 정합성 동기화(S012)/검증(S013) 배치는 이 초기화와 무관하게 계속
  // 자기 스케줄대로 돈다.
  const handleResetMetrics = useCallback(() => {
    resetMonitoringMetrics().catch((e) => {
      console.error("[HighFive] 지표 초기화 실패", e);
    });
  }, []);

  // 재시도해도 영원히 실패할 PEL을 강제로 비운다 - DB에는 반영되지 않고 그냥 버려지는 것이므로
  // 되돌릴 수 없다는 걸 확인받는다.
  const handleDrainPending = useCallback(() => {
    const confirmed = window.confirm(
      `쿠폰 #${couponId}의 Stream PEL을 강제로 비웁니다.\n` +
      `대기 중인 메시지는 DB에 반영되지 않고 그대로 버려지며, 되돌릴 수 없습니다.\n` +
      `계속할까요?`
    );
    if (!confirmed) return;

    drainPendingStream(couponId)
      .then((acked) => {
        console.info(`[HighFive] PEL 강제 드레인 완료 - couponId=${couponId}, acked=${acked}`);
      })
      .catch((e) => {
        console.error("[HighFive] PEL 강제 드레인 실패", e);
      });
  }, [couponId]);

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main">
        <DashboardHeader
          vals={vals}
          error={error}
          coupons={coupons}
          couponId={couponId}
          onCouponChange={setCouponId}
        />

        <div className="row">
          <ServerResourceCard vals={vals} />
          <ApiResponseCard vals={vals} />
          <CouponStatusCard vals={vals} />
        </div>

        <div className="row">
          <RedisStockCard vals={vals} onDrainPending={handleDrainPending} />
          <DbStorageCard vals={vals} />
        </div>
      </div>

      <FloatingActionMenu
        vals={vals}
        activeScenario={activeScenario}
        onStartTest={handleStartTest}
        onStopTest={handleStopTest}
        onLoadData={handleLoadData}
        onResetMetrics={handleResetMetrics}
      />
    </div>
  );
}
