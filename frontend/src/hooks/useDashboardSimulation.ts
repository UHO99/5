import { useCallback, useEffect, useRef, useState } from "react";
import { colorFor, fmt, jitter, lerp } from "../lib/format";

/**
 * TODO(API 연동): 지금은 실제 백엔드 대신 IDLE/LOAD 두 기준값 사이를 매초 보간(lerp)하며
 * 그럴듯한 움직임을 흉내낸다. 나중에 실제 지표(Redis/DB/Actuator 등)를 붙일 때는 이 훅을
 * 폴링 기반 fetch 훅으로 통째로 교체하면 되고, 아래 DashboardVals 형태(필드명)는
 * 컴포넌트들이 그대로 소비하므로 최대한 유지하는 걸 권장한다.
 */

interface Baseline {
  rps: number;
  cpu: number;
  mem: number;
  heap: number;
  apiAvg: number;
  p95: number;
  p99: number;
  err: number;
  perSec: number;
  dbInsert: number;
  dbConn: number;
}

const IDLE: Baseline = { rps: 1100, cpu: 24, mem: 38, heap: 47, apiAvg: 32, p95: 85, p99: 140, err: 0.15, perSec: 9, dbInsert: 95, dbConn: 9 };
const LOAD: Baseline = { rps: 6200, cpu: 80, mem: 75, heap: 85, apiAvg: 185, p95: 520, p99: 1100, err: 2.1, perSec: 850, dbInsert: 1650, dbConn: 45 };

interface SimState {
  now: number;
  testRunning: boolean;
  startedAt: number | null;
  rps: number;
  cpu: number;
  mem: number;
  heap: number;
  apiAvg: number;
  p95: number;
  p99: number;
  err: number;
  couponTotal: number;
  couponSuccess: number;
  couponFailSoldOut: number;
  couponFailDup: number;
  perSec: number;
  redisTotal: number;
  redisStock: number;
  dbInsert: number;
  dbConnUsed: number;
  dbConnTotal: number;
  dbIssueCount: number;
  openCouponCount: number;
  activeStreamSubs: number;
  batchAvg: number;
  batchMax: number;
}

function initialState(): SimState {
  return {
    now: Date.now(),
    testRunning: false,
    startedAt: null,
    rps: IDLE.rps, cpu: IDLE.cpu, mem: IDLE.mem, heap: IDLE.heap,
    apiAvg: IDLE.apiAvg, p95: IDLE.p95, p99: IDLE.p99, err: IDLE.err,
    couponTotal: 0, couponSuccess: 0, couponFailSoldOut: 0, couponFailDup: 0, perSec: IDLE.perSec,
    redisTotal: 20000, redisStock: 20000,
    dbInsert: IDLE.dbInsert, dbConnUsed: IDLE.dbConn, dbConnTotal: 50,
    dbIssueCount: 0,
    openCouponCount: 1, activeStreamSubs: 1,
    batchAvg: 40, batchMax: 0,
  };
}

function tick(s: SimState): SimState {
  const now = Date.now();
  const target = s.testRunning ? LOAD : IDLE;

  const rps = Math.max(0, lerp(s.rps, jitter(target.rps, 0.15), 0.35));
  const cpu = Math.min(99, Math.max(5, lerp(s.cpu, jitter(target.cpu, 0.1), 0.3)));
  const mem = Math.min(99, Math.max(10, lerp(s.mem, jitter(target.mem, 0.08), 0.25)));
  const heap = Math.min(99, Math.max(15, lerp(s.heap, jitter(target.heap, 0.08), 0.25)));
  const apiAvg = Math.max(5, lerp(s.apiAvg, jitter(target.apiAvg, 0.2), 0.3));
  const p95 = Math.max(apiAvg, lerp(s.p95, jitter(target.p95, 0.2), 0.3));
  const p99 = Math.max(p95, lerp(s.p99, jitter(target.p99, 0.2), 0.3));
  const err = Math.min(15, Math.max(0, lerp(s.err, jitter(target.err, 0.3), 0.3)));
  const dbInsert = Math.max(0, lerp(s.dbInsert, jitter(target.dbInsert, 0.15), 0.3));
  const dbConnUsed = Math.min(s.dbConnTotal, Math.max(1, lerp(s.dbConnUsed, jitter(target.dbConn, 0.1), 0.3)));

  const perSec = Math.max(0, lerp(s.perSec, jitter(target.perSec, 0.2), 0.35));
  const increment = Math.round(perSec);
  const possible = Math.min(increment, s.redisStock);
  const dupFail = Math.round(increment * (s.testRunning ? 0.03 + Math.random() * 0.06 : 0.01));
  const soldOutFail = increment - possible;
  const success = Math.max(0, possible - dupFail);

  const couponSuccess = s.couponSuccess + success;
  const pendingBefore = couponSuccess - s.dbIssueCount;
  const dbIssueCount = Math.min(couponSuccess, s.dbIssueCount + Math.round(pendingBefore * 0.5 + Math.random() * 3));

  const batchSize = Math.min(500, Math.round(increment * (0.8 + Math.random() * 0.6)));
  const batchAvg = lerp(s.batchAvg, batchSize, 0.3);
  const batchMax = Math.max(s.batchMax, batchSize);

  return {
    ...s,
    now, rps, cpu, mem, heap, apiAvg, p95, p99, err,
    perSec, dbInsert, dbConnUsed, dbIssueCount, batchAvg, batchMax,
    couponTotal: s.couponTotal + increment,
    couponSuccess,
    couponFailSoldOut: s.couponFailSoldOut + soldOutFail,
    couponFailDup: s.couponFailDup + dupFail,
    redisStock: Math.max(0, s.redisStock - success),
  };
}

export interface DashboardVals {
  clockText: string;
  systemStatusColor: string;
  systemStatusLabel: string;
  rpsFmt: string;
  cpuFmt: string; cpuColor: string;
  memFmt: string; memColor: string;
  heapFmt: string; heapColor: string;
  apiAvgFmt: string; p95Fmt: string; p99Fmt: string;
  errFmt: string; errColor: string;
  successLatFmt: string; failLatFmt: string;
  successLatBarPct: string; failLatBarPct: string;
  couponTotalFmt: string;
  couponSuccessFmt: string;
  couponFailFmt: string;
  couponPerSecFmt: string;
  soldOutFmt: string; dupFmt: string;
  soldOutPctStyle: string; dupPctStyle: string;
  issuedCountFmt: string;
  dbIssueCountFmt: string;
  overissueLabel: string; overissueBg: string; overissueFg: string;
  redisStockFmt: string;
  issuedPct: number; issuedPctFmt: string;
  activeStreamSubsFmt: number; openCouponFmt: number;
  streamSubColor: string;
  pelCountFmt: string; pelColor: string;
  pelBarPct: string;
  pelDelayFmt: string;
  cpuBarHeight: string; memBarHeight: string; heapBarHeight: string;
  dbInsertFmt: string;
  dbConnFmt: string; dbConnColor: string;
  batchAvgFmt: string; batchMaxFmt: string;
  batchAvgPct: string; batchMaxPct: string;
  testRunning: boolean;
  elapsedText: string;
  testButtonLabel: string;
}

function renderVals(s: SimState): DashboardVals {
  const dbConnPct = (s.dbConnUsed / s.dbConnTotal) * 100;
  const anyDanger = s.cpu >= 85 || s.mem >= 85 || s.err >= 3 || dbConnPct >= 90;
  const anyWarn = s.cpu >= 60 || s.mem >= 60 || s.err >= 1 || dbConnPct >= 70;
  const issuedPct = ((s.redisTotal - s.redisStock) / s.redisTotal) * 100;
  const couponFailTotal = s.couponFailSoldOut + s.couponFailDup;
  const soldOutPct = couponFailTotal > 0 ? (s.couponFailSoldOut / couponFailTotal) * 100 : 0;
  const pelCount = Math.max(0, s.couponSuccess - s.dbIssueCount);
  const pelDelayMs = (pelCount / Math.max(1, s.dbInsert)) * 1000;
  const overissueOk = pelCount < 50;

  let elapsedText = "";
  if (s.testRunning && s.startedAt) {
    const sec = Math.floor((s.now - s.startedAt) / 1000);
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    elapsedText = `${m}:${String(r).padStart(2, "0")}`;
  }

  return {
    clockText: new Date(s.now).toLocaleTimeString("ko-KR"),
    systemStatusColor: anyDanger ? "#dc2626" : anyWarn ? "#e0821f" : "#16a34a",
    systemStatusLabel: anyDanger ? "병목 감지" : anyWarn ? "부하 상승" : "전체 정상",
    rpsFmt: fmt(s.rps),
    cpuFmt: s.cpu.toFixed(1), cpuColor: colorFor(s.cpu, 60, 85),
    memFmt: s.mem.toFixed(1), memColor: colorFor(s.mem, 60, 85),
    heapFmt: s.heap.toFixed(1), heapColor: colorFor(s.heap, 70, 90),
    apiAvgFmt: fmt(s.apiAvg), p95Fmt: fmt(s.p95), p99Fmt: fmt(s.p99),
    errFmt: s.err.toFixed(2), errColor: colorFor(s.err, 1, 3),
    successLatFmt: fmt(s.apiAvg * 0.9), failLatFmt: fmt(s.apiAvg * 1.7),
    successLatBarPct: `${Math.min(100, ((s.apiAvg * 0.9) / 500) * 100)}%`,
    failLatBarPct: `${Math.min(100, ((s.apiAvg * 1.7) / 500) * 100)}%`,
    couponTotalFmt: fmt(s.couponTotal),
    couponSuccessFmt: fmt(s.couponSuccess),
    couponFailFmt: fmt(couponFailTotal),
    couponPerSecFmt: `${fmt(s.perSec)} / s`,
    soldOutFmt: fmt(s.couponFailSoldOut), dupFmt: fmt(s.couponFailDup),
    soldOutPctStyle: `${soldOutPct}%`, dupPctStyle: `${100 - soldOutPct}%`,
    issuedCountFmt: fmt(s.redisTotal - s.redisStock),
    dbIssueCountFmt: fmt(s.dbIssueCount),
    overissueLabel: overissueOk ? "일치" : "반영 지연",
    overissueBg: overissueOk ? "#e9f9ee" : "#fff4e6",
    overissueFg: overissueOk ? "#16a34a" : "#e0821f",
    redisStockFmt: `${fmt(s.redisStock)} / ${fmt(s.redisTotal)}`,
    issuedPct, issuedPctFmt: issuedPct.toFixed(1),
    activeStreamSubsFmt: s.activeStreamSubs, openCouponFmt: s.openCouponCount,
    streamSubColor: s.activeStreamSubs === s.openCouponCount ? "#16a34a" : "#e0821f",
    pelCountFmt: fmt(pelCount), pelColor: colorFor(pelCount, 200, 1000),
    pelBarPct: `${Math.min(100, (pelCount / 1500) * 100)}%`,
    pelDelayFmt: pelDelayMs < 1000 ? `${Math.round(pelDelayMs)}ms` : `${(pelDelayMs / 1000).toFixed(1)}s`,
    cpuBarHeight: `${Math.max(4, s.cpu)}%`, memBarHeight: `${Math.max(4, s.mem)}%`, heapBarHeight: `${Math.max(4, s.heap)}%`,
    dbInsertFmt: `${fmt(s.dbInsert)} / s`,
    dbConnFmt: `${fmt(s.dbConnUsed)} / ${s.dbConnTotal}`,
    dbConnColor: colorFor(dbConnPct, 70, 90),
    batchAvgFmt: fmt(s.batchAvg), batchMaxFmt: fmt(s.batchMax),
    batchAvgPct: `${Math.min(100, (s.batchAvg / 500) * 100)}%`,
    batchMaxPct: `${Math.min(100, (s.batchMax / 500) * 100)}%`,
    testRunning: s.testRunning,
    elapsedText,
    testButtonLabel: s.testRunning ? "테스트 중지" : "테스트 시작",
  };
}

export function useDashboardSimulation(): { vals: DashboardVals; toggleTest: () => void } {
  const [state, setState] = useState<SimState>(initialState);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setState((s) => tick(s));
    }, 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, []);

  const toggleTest = useCallback(() => {
    setState((s) => {
      if (!s.testRunning) {
        return {
          ...s,
          testRunning: true,
          startedAt: Date.now(),
          couponTotal: 0, couponSuccess: 0, couponFailSoldOut: 0, couponFailDup: 0,
          redisStock: s.redisTotal,
          dbIssueCount: 0,
          batchMax: 0,
        };
      }
      return { ...s, testRunning: false };
    });
  }, []);

  return { vals: renderVals(state), toggleTest };
}
