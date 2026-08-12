import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import * as reservationsApi from '../../lib/api/reservations'
import * as roomsApi from '../../lib/api/rooms'
import { ApiError } from '../../lib/api/client'
import type { ReservationResponse, RoomResponseDto } from '../../lib/api/types'
import { toUiStatus, type ReservationStatus } from '../../lib/reservationStatus'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const STATUS_CFG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: '결제 대기', color: '#b45309', bg: '#fffbeb' },
  confirmed:    { label: '확정',     color: '#16a34a', bg: '#f0fdf4' },
  cancelled:    { label: '취소',     color: '#6b7280', bg: '#f9fafb' },
  payment_done: { label: '승인 대기', color: '#7c3aed', bg: '#f5f3ff' },
  rejected:     { label: '거절',     color: '#dc2626', bg: '#fef2f2' },
}

/* ── 거절 사유 모달 (사유 입력 필수) ── */
function RejectModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h3 className="text-base font-bold text-gray-900">예약 거절</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-3">거절 사유를 입력해주세요.</p>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            rows={4} placeholder="예: 시설 점검으로 인해 예약을 거절합니다."
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none resize-none"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
          />
        </div>
        <div className="px-6 py-4 flex gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
            닫기
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
            거절 확정
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ReservationManagePage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<ReservationResponse[]>([])
  const [rooms, setRooms] = useState<RoomResponseDto[]>([])
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all')
  const [searchRoom, setSearchRoom]     = useState('')
  const [rejectId, setRejectId]         = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [reservationPage, roomPage] = await Promise.all([
        reservationsApi.adminListReservations(),
        roomsApi.listRooms(0, 100),
      ])
      setReservations(reservationPage.content)
      setRooms(roomPage.content)
    } catch {
      showToast('예약 목록을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const roomName = (roomId: number) => rooms.find((r) => r.id === roomId)?.name ?? `방 #${roomId}`

  const filtered = reservations.filter((r) => {
    if (filterStatus !== 'all' && toUiStatus(r.status) !== filterStatus) return false
    if (searchRoom && !roomName(r.roomId).includes(searchRoom)) return false
    return true
  })

  // 승인/거절은 결제까지 끝난(PAYMENT_DONE) 예약만 가능하다 (백엔드 ReservationAdminServiceImpl 규칙과 동일).
  // PENDING은 아직 결제 대기 중이라 관리자가 액션을 취할 대상이 아니다.
  const actionNeededCount = reservations.filter((r) => r.status === 'PAYMENT_DONE').length

  const handleApprove = async (id: number) => {
    try {
      await reservationsApi.adminConfirmReservation(id, 'CONFIRMED')
      showToast('예약이 승인되었습니다.', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '승인에 실패했습니다.', 'error')
    }
  }

  const handleReject = async (reason: string) => {
    if (rejectId === null) return
    try {
      await reservationsApi.adminRejectReservation(rejectId, reason)
      setRejectId(null)
      showToast('예약이 거절되었습니다.', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '거절에 실패했습니다.', 'error')
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>예약 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              전체 {reservations.length}건
              {actionNeededCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: '#fffbeb', color: '#b45309' }}>
                  승인 대기 {actionNeededCount}건
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 필터 */}
        <div className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-center" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="relative flex-1 min-w-[180px]">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input type="text" placeholder="방 이름" value={searchRoom} onChange={(e) => setSearchRoom(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'confirmed', 'cancelled', 'rejected'] as const).map((s) => {
              const labels = { all: '전체', pending: '승인 대기', confirmed: '확정', cancelled: '취소', rejected: '거절' }
              const active = filterStatus === s
              const cfg = s !== 'all' ? STATUS_CFG[s] : null
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                  style={{
                    background: active ? (cfg?.bg ?? '#1e3a5f') : '#f8fafc',
                    color: active ? (cfg?.color ?? '#fff') : '#64748b',
                    border: `1.5px solid ${active ? (cfg?.color ?? '#1e3a5f') : '#e2e8f0'}`,
                  }}>
                  {labels[s]}
                </button>
              )
            })}
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
                  {['예약 ID', '방', '날짜', '시간', '상태', '관리'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-sm text-gray-400">예약 내역이 없습니다</td></tr>
                ) : (
                  filtered.map((r, i) => {
                    const s = STATUS_CFG[toUiStatus(r.status)]
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', background: r.status === 'PAYMENT_DONE' ? '#fffcf0' : '#fff' }}>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-semibold text-gray-500">#{String(r.id).padStart(4, '0')}</span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{roomName(r.roomId)}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{r.reservationDate}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{r.startTime.slice(11, 16)}–{r.endTime.slice(11, 16)}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          {r.status === 'PAYMENT_DONE' ? (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleApprove(r.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                                승인
                              </button>
                              <button onClick={() => setRejectId(r.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                                거절
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #e8edf5' }}>
            <span className="text-xs text-gray-400">{filtered.length}건 표시 중 (전체 {reservations.length}건)</span>
          </div>
        </div>
      </div>

      {rejectId !== null && <RejectModal onConfirm={handleReject} onClose={() => setRejectId(null)} />}
    </div>
  )
}
