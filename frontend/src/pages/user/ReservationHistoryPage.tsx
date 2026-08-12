import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import * as reservationsApi from '../../lib/api/reservations'
import * as roomsApi from '../../lib/api/rooms'
import { ApiError } from '../../lib/api/client'
import type { ReservationResponse, RoomResponseDto } from '../../lib/api/types'
import { toUiStatus, type ReservationStatus } from '../../lib/reservationStatus'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const STATUS_TABS: { key: ReservationStatus | 'all'; label: string }[] = [
  { key: 'all',          label: '전체' },
  { key: 'pending',      label: '대기 중' },
  { key: 'confirmed',    label: '확정' },
  { key: 'payment_done', label: '결제 완료' },
  { key: 'cancelled',    label: '취소됨' },
  { key: 'rejected',     label: '거절됨' },
]

/* ── 취소 사유 모달 (사유 입력 필수) ── */
function CancelModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h3 className="text-base font-bold text-gray-900">예약 취소</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-3">취소 사유를 입력해주세요.</p>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            rows={4} placeholder="예: 일정 변경으로 인해 취소합니다."
            className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none resize-none"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
          />
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
            닫기
          </button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
            취소 확정
          </button>
        </div>
      </div>
    </div>
  )
}

interface EnrichedReservation {
  reservation: ReservationResponse
  room: RoomResponseDto | null
}

export default function ReservationHistoryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { name, email } = useAuth()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<EnrichedReservation[]>([])
  const [activeTab, setActiveTab] = useState<ReservationStatus | 'all'>('all')
  const [cancelId, setCancelId]   = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const reservations = await reservationsApi.getMyReservations()
      const roomCache = new Map<number, RoomResponseDto>()
      const uniqueRoomIds = [...new Set(reservations.map((r) => r.roomId))]
      // 중복 제거된 roomId 목록을 배치 조회 1번으로 가져온다.
      const rooms = await roomsApi.getRoomsByIds(uniqueRoomIds)
      rooms.forEach((room) => roomCache.set(room.id, room))
      setItems(reservations.map((r) => ({ reservation: r, room: roomCache.get(r.roomId) ?? null })))
    } catch {
      showToast('예약 내역을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const filtered = activeTab === 'all' ? items : items.filter((it) => toUiStatus(it.reservation.status) === activeTab)

  const handleCancel = async (reason: string) => {
    if (cancelId === null) return
    try {
      await reservationsApi.cancelReservation(cancelId, reason)
      setCancelId(null)
      showToast('예약이 취소되었습니다.', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '예약 취소에 실패했습니다.', 'error')
    }
  }

  // 결제 실패/미완료로 PENDING에 머무른 예약을 예약 내역에서 바로 재결제할 수 있도록,
  // 기존 예약(orderId)·결제 금액(amount) 그대로 결제 페이지로 되돌아간다 (새 예약을 만들지 않음).
  const handleRetryPayment = (r: ReservationResponse, room: RoomResponseDto | null) => {
    const startHour = new Date(r.startTime).getHours()
    const endHour = new Date(r.endTime).getHours()
    const selectedHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)

    navigate(`/user/rooms/${r.roomId}/payment`, {
      state: {
        roomId: r.roomId,
        roomName: room?.name ?? `방 #${r.roomId}`,
        date: r.reservationDate,
        startHour,
        endHour,
        selectedHours,
        price: r.amount,
        basePrice: r.amount,
        discount: 0,
        orderId: r.orderId,
        reservationId: r.id,
        customerName: name,
        customerEmail: email,
      },
    })
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  return (
    <>
      {cancelId !== null && (
        <CancelModal onConfirm={handleCancel} onClose={() => setCancelId(null)} />
      )}

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>예약 내역</h1>
              <p className="text-sm text-gray-500 mt-1">총 {items.length}건</p>
            </div>
          </div>

          {/* 상태 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
            {STATUS_TABS.map((tab) => {
              const active = activeTab === tab.key
              const count  = tab.key === 'all' ? items.length : items.filter((it) => toUiStatus(it.reservation.status) === tab.key).length
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0"
                  style={{
                    background: active ? '#1e3a5f' : '#f8fafc',
                    color: active ? '#fff' : '#64748b',
                    border: `1.5px solid ${active ? '#1e3a5f' : '#e2e8f0'}`,
                  }}>
                  {tab.label}
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: active ? '#fff' : '#64748b' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 리스트 */}
          {filtered.length === 0 ? (
            <EmptyState
              title="예약 내역이 없습니다"
              description={activeTab === 'all' ? '스터디룸을 예약해보세요.' : `${STATUS_TABS.find(t => t.key === activeTab)?.label} 상태의 예약이 없습니다.`}
              action={activeTab === 'all' ? { label: '룸 목록 보기', onClick: () => navigate('/user/rooms') } : undefined}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(({ reservation: r, room }) => {
                const hours = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3600000
                const estimatedPrice = room ? Math.round(room.discountedPrice * hours) : null
                const uiStatus = toUiStatus(r.status)
                return (
                  <div key={r.id} className="rounded-2xl p-4 md:p-5"
                    style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">#{String(r.id).padStart(4, '0')}</span>
                          <h3 className="text-sm font-bold text-gray-900">{room?.name ?? `방 #${r.roomId}`}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                          <span>{r.reservationDate}</span>
                          <span>·</span>
                          <span>{r.startTime.slice(11, 16)} ~ {r.endTime.slice(11, 16)}</span>
                          {estimatedPrice !== null && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-gray-900">약 {estimatedPrice.toLocaleString()}원</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="reservationStatus" value={uiStatus} />
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/user/rooms/${r.roomId}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        룸 보기
                      </button>
                      {/* 백엔드 cancel()은 PENDING/PAYMENT_DONE/CONFIRMED 전부 취소를 허용한다
                          (결제 전이면 그냥 취소, 결제 후면 Toss 환불 후 취소). CANCELLED/REJECTED는 이미 종결 상태라 제외. */}
                      {(uiStatus === 'pending' || uiStatus === 'payment_done' || uiStatus === 'confirmed') && (
                        <button onClick={() => setCancelId(r.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                          취소하기
                        </button>
                      )}
                      {uiStatus === 'pending' && (
                        <button onClick={() => handleRetryPayment(r, room)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: '#0064FF' }}>
                          결제하기
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
