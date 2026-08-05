import { useState, useEffect, useCallback } from 'react'
import * as roomsApi from '../../lib/api/rooms'
import * as reservationsApi from '../../lib/api/reservations'
import type { ReservationResponse, RoomResponseDto } from '../../lib/api/types'
import { toUiStatus, type ReservationStatus } from '../../lib/reservationStatus'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const STATUS_COLOR: Record<ReservationStatus, { color: string; bg: string; label: string }> = {
  pending:      { color: '#b45309', bg: '#fffbeb', label: '결제 대기' },
  confirmed:    { color: '#16a34a', bg: '#f0fdf4', label: '확정' },
  cancelled:    { color: '#6b7280', bg: '#f9fafb', label: '취소' },
  payment_done: { color: '#7c3aed', bg: '#f5f3ff', label: '승인 대기' },
  rejected:     { color: '#dc2626', bg: '#fef2f2', label: '거절' },
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string; bg?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold mb-0.5" style={{ color, letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<RoomResponseDto[]>([])
  const [reservations, setReservations] = useState<ReservationResponse[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [roomPage, reservationPage] = await Promise.all([
        roomsApi.listRooms(0, 100),
        reservationsApi.adminListReservations(),
      ])
      setRooms(roomPage.content)
      setReservations(reservationPage.content)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  const roomName = (roomId: number) => rooms.find((r) => r.id === roomId)?.name ?? `방 #${roomId}`

  const pending      = reservations.filter((r) => r.status === 'PENDING').length
  const confirmed    = reservations.filter((r) => r.status === 'CONFIRMED').length
  const paymentDone  = reservations.filter((r) => r.status === 'PAYMENT_DONE').length

  // 방별 확정 예약 건수
  const roomCounts = rooms.map((room) => ({
    ...room,
    count: reservations.filter((r) => r.roomId === room.id && r.status === 'CONFIRMED').length,
  })).sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...roomCounts.map((r) => r.count), 1)

  // 최근 예약 (최신 5건)
  const recent = [...reservations].sort((a, b) => b.id - a.id).slice(0, 5)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">스터디룸 운영 현황을 한눈에 확인하세요</p>
        </div>

        {/* 핵심 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="전체 방" value={rooms.length} sub="등록된 스터디룸" color="#2d5a9e" bg="#eff6ff" />
          <StatCard label="결제 대기" value={pending} sub="사용자 결제 대기중" color="#b45309" bg="#fffbeb" />
          <StatCard label="확정 예약" value={confirmed} sub="총 누적" color="#16a34a" bg="#f0fdf4" />
          <StatCard label="승인 대기" value={paymentDone} sub="처리 필요" color="#7c3aed" bg="#f5f3ff" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* 방별 예약 건수 */}
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-bold text-gray-900 mb-5">방별 확정 예약 건수</h2>
            <div className="flex flex-col gap-3">
              {roomCounts.map((room) => (
                <div key={room.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{room.name}</span>
                    <span className="text-xs font-bold" style={{ color: '#2d5a9e' }}>{room.count}건</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(room.count / maxCount) * 100}%`,
                        background: room.count > 0
                          ? 'linear-gradient(90deg, #2d5a9e, #60a5fa)'
                          : 'transparent',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 예약 상태 분포 */}
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 className="text-sm font-bold text-gray-900 mb-5">예약 상태 분포</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(STATUS_COLOR) as [ReservationStatus, typeof STATUS_COLOR[ReservationStatus]][]).map(([status, cfg]) => {
                const count = reservations.filter((r) => toUiStatus(r.status) === status).length
                return (
                  <div key={status} className="rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                    <div className="text-xs font-medium mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
                    <div className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</div>
                    <div className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>
                      {reservations.length ? Math.round((count / reservations.length) * 100) : 0}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 최근 예약 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
            <h2 className="text-sm font-bold text-gray-900">최근 예약</h2>
            <span className="text-xs text-gray-400">최근 {recent.length}건</span>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['예약 ID', '방', '날짜 / 시간', '상태'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-sm text-gray-400">예약 내역이 없습니다</td></tr>
              ) : recent.map((r, i) => {
                const s = STATUS_COLOR[toUiStatus(r.status)]
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: i < recent.length - 1 ? '1px solid #f9fafb' : 'none', background: '#fff' }}>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono font-medium text-gray-500">#{String(r.id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">{roomName(r.roomId)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                      {r.reservationDate}<br />
                      <span className="text-gray-400">{r.startTime.slice(11, 16)}–{r.endTime.slice(11, 16)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
