import { GRADE_CONFIG, type Grade } from '../../context/AuthContext'
import type { ReservationStatus } from '../../lib/reservationStatus'

/* ── 예약 상태 설정 ── */
const RESERVATION_STATUS_CFG: Record<ReservationStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:      { label: '대기 중',   color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  confirmed:    { label: '확정',      color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  cancelled:    { label: '취소됨',    color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' },
  payment_done: { label: '결제 완료', color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  rejected:     { label: '거절됨',    color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
}

const ROOM_STATUS_CFG = {
  available: { label: '사용 가능', color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  reserved:  { label: '예약됨',   color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
}

type BadgeVariant =
  | { variant: 'grade'; value: Grade }
  | { variant: 'reservationStatus'; value: ReservationStatus }
  | { variant: 'roomStatus'; value: 'available' | 'reserved' }

export function Badge(props: BadgeVariant) {
  let color: string, bg: string, dot: string, label: string

  if (props.variant === 'grade') {
    const cfg = GRADE_CONFIG[props.value]
    color = cfg.color; bg = cfg.bg; label = cfg.label; dot = cfg.color
  } else if (props.variant === 'reservationStatus') {
    const cfg = RESERVATION_STATUS_CFG[props.value]
    color = cfg.color; bg = cfg.bg; dot = cfg.dot; label = cfg.label
  } else {
    const cfg = ROOM_STATUS_CFG[props.value]
    color = cfg.color; bg = cfg.bg; dot = cfg.dot; label = cfg.label
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color, background: bg }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
      {label}
    </span>
  )
}
