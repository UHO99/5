import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import * as roomsApi from '../../lib/api/rooms'
import * as reservationsApi from '../../lib/api/reservations'
import { ApiError } from '../../lib/api/client'
import type { ReservationResponse, RoomResponseDto } from '../../lib/api/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

/* ─── 달력 ────────────────────────────────────────────────── */
function CalendarPicker({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = today.toISOString().slice(0, 10)
  const toStr = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const prevMonth = () => viewMonth === 0 ? (setViewYear(y => y - 1), setViewMonth(11)) : setViewMonth(m => m - 1)
  const nextMonth = () => viewMonth === 11 ? (setViewYear(y => y + 1), setViewMonth(0)) : setViewMonth(m => m + 1)

  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const DAYS   = ['일','월','화','수','목','금','토']

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-sm font-bold text-gray-900">{viewYear}년 {MONTHS[viewMonth]}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
      <div className="px-4 pb-4 pt-2">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={d} className="text-center text-xs font-semibold py-1.5" style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#9ca3af' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />
            const ds = toStr(d)
            const isPast = ds < todayStr
            const isSel  = ds === selected
            const isTod  = ds === todayStr
            const dow    = (firstDay + d - 1) % 7
            return (
              <button key={idx} disabled={isPast} onClick={() => onSelect(ds)}
                className="aspect-square flex items-center justify-center rounded-xl text-sm transition-all"
                style={{
                  background: isSel ? 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' : isTod ? '#eff6ff' : 'transparent',
                  color: isSel ? '#fff' : isPast ? '#d1d5db' : dow === 0 ? '#ef4444' : dow === 6 ? '#3b82f6' : '#374151',
                  fontWeight: isSel || isTod ? 700 : 500,
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  outline: isTod && !isSel ? '1.5px solid #bfdbfe' : 'none',
                }}>
                {d}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── 메인 ────────────────────────────────────────────────── */
const SLOT_HOURS = Array.from({ length: 12 }, (_, i) => i + 9) // 9~20

export default function ReservePage() {
  const { roomId } = useParams()
  const navigate   = useNavigate()
  const { name, email } = useAuth()
  const { showToast } = useToast()

  const id = Number(roomId)
  const [room, setRoom] = useState<RoomResponseDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [occupiedReservations, setOccupiedReservations] = useState<ReservationResponse[]>([])

  const [step, setStep]               = useState<1 | 2>(1)
  const [date, setDate]               = useState('')
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set())

  const loadRoom = useCallback(async () => {
    setLoading(true)
    try {
      const [roomData, occupied] = await Promise.all([
        roomsApi.getRoom(id),
        reservationsApi.getOccupiedReservations(id),
      ])
      setRoom(roomData)
      setOccupiedReservations(occupied)
    } catch {
      setRoom(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadRoom() }, [loadRoom])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  if (!room) return (
    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">방을 찾을 수 없습니다.</div>
  )

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const isPastHour = (h: number) => date === todayStr && h <= now.getHours()

  const isOccupiedHour = (h: number) => occupiedReservations.some((r) => {
    if (r.reservationDate !== date) return false
    const startHour = Number(r.startTime.slice(11, 13))
    const endHour   = Number(r.endTime.slice(11, 13))
    return h >= startHour && h < endHour
  })

  const discount    = room.price > 0 ? 1 - room.discountedPrice / room.price : 0
  const toggleSlot = (h: number) => {
    if (isPastHour(h) || isOccupiedHour(h)) return
    setSelectedHours((prev) => {
      const next = new Set(prev)
      next.has(h) ? next.delete(h) : next.add(h)
      return next
    })
  }

  const sortedHours = [...selectedHours].sort((a, b) => a - b)
  const totalHours  = selectedHours.size
  const basePrice   = totalHours * room.price
  const finalPrice  = totalHours * room.discountedPrice
  const canNext     = date !== '' && selectedHours.size > 0

  const handleToPayment = async () => {
    const startHour = Math.min(...sortedHours)
    const endHour   = Math.max(...sortedHours) + 1
    const pad = (n: number) => String(n).padStart(2, '0')
    setSubmitting(true)
    try {
      const reservation = await reservationsApi.insertReservation(id, {
        reservationDate: date,
        startTime: `${date}T${pad(startHour)}:00:00`,
        endTime: `${date}T${pad(endHour)}:00:00`,
        amount: finalPrice,
      })
      navigate(`/user/rooms/${id}/payment`, {
        state: {
          roomId: id,
          roomName: room.name,
          date,
          startHour,
          endHour,
          selectedHours: sortedHours,
          price: finalPrice,
          basePrice,
          discount,
          orderId: reservation.orderId,
          reservationId: reservation.id,
          customerName: name,
          customerEmail: email,
        },
      })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '예약 생성에 실패했습니다. 다른 시간대를 선택해주세요.', 'error')
      setSubmitting(false)
    }
  }

  const slotLabel = (h: number) => `${h}:00~${h + 1}:00`

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* 뒤로가기 */}
        <button onClick={() => navigate('/user/rooms')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          목록으로 돌아가기
        </button>

        {/* 방 정보 배너 */}
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-4" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">{room.name}</div>
            <div className="text-sm text-gray-500">최대 {room.capacity}명 · {room.price.toLocaleString()}원/시간</div>
          </div>
          {discount > 0 && (
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400">등급 할인</div>
              <div className="text-sm font-bold" style={{ color: '#16a34a' }}>-{Math.round(discount * 100)}%</div>
            </div>
          )}
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-3 mb-6">
          {(['날짜 · 시간 선택', '예약 확인'] as const).map((label, i) => {
            const s = i + 1
            const active = step === s
            const done   = step > s
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{ background: done ? '#16a34a' : active ? '#1e3a5f' : '#f1f5f9', color: (done || active) ? '#fff' : '#9ca3af' }}>
                  {done ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> : s}
                </div>
                <span className="text-xs font-semibold" style={{ color: active ? '#1e3a5f' : done ? '#6b7280' : '#9ca3af' }}>{label}</span>
                {i < 1 && <div className="w-8 h-px mx-1" style={{ background: step > 1 ? '#16a34a' : '#e2e8f0' }} />}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: 날짜 + 시간 선택 ── */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              {/* 달력 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">날짜 선택</p>
                <CalendarPicker selected={date} onSelect={(d) => { setDate(d); setSelectedHours(new Set()) }} />
              </div>

              {/* 시간 슬롯 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">시간 선택</p>
                {!date ? (
                  <div className="rounded-2xl flex flex-col items-center justify-center py-12 text-center" style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p className="text-sm text-gray-400 mt-3">먼저 날짜를 선택해주세요</p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
                    <p className="text-xs text-gray-500 mb-3">
                      <span className="font-semibold text-gray-800">{date}</span> · 여러 시간대를 중복 선택할 수 있습니다
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SLOT_HOURS.map((h) => {
                        const sel = selectedHours.has(h)
                        const past = isPastHour(h)
                        const occupied = isOccupiedHour(h)
                        const blocked = past || occupied
                        return (
                          <button key={h} disabled={blocked} onClick={() => toggleSlot(h)}
                            className="py-2 px-1 rounded-xl text-xs font-semibold transition-all"
                            style={{
                              background: sel ? 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' : occupied ? '#fef2f2' : past ? '#f1f5f9' : '#f8fafc',
                              color: sel ? '#fff' : occupied ? '#fca5a5' : past ? '#cbd5e1' : '#374151',
                              border: sel ? '1.5px solid #1e3a5f' : occupied ? '1.5px solid #fecaca' : past ? '1.5px solid #e5e7eb' : '1.5px solid #e2e8f0',
                              cursor: blocked ? 'not-allowed' : 'pointer',
                              textDecoration: blocked ? 'line-through' : 'none',
                            }}>
                            {slotLabel(h)}
                          </button>
                        )
                      })}
                    </div>
                    {/* 범례 */}
                    <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      {[
                        { bg: '#f8fafc', border: '#e2e8f0', label: '선택 가능' },
                        { bg: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', border: '#1e3a5f', label: '선택됨' },
                        { bg: '#fef2f2', border: '#fecaca', label: '예약됨' },
                        { bg: '#f1f5f9', border: '#e5e7eb', label: '지난 시간' },
                      ].map((x) => (
                        <div key={x.label} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded" style={{ background: x.bg, border: `1px solid ${x.border}` }} />
                          <span className="text-[10px] text-gray-400">{x.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">예약된 시간대는 선택할 수 없으며, 최종 확정 여부는 서버에서도 다시 검증됩니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 선택 요약 + 다음 */}
            <div className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ background: canNext ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${canNext ? '#bfdbfe' : '#e2e8f0'}` }}>
              <div className="text-sm">
                {canNext ? (
                  <div>
                    <span className="font-semibold text-gray-900">{date}</span>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="font-semibold" style={{ color: '#1e3a5f' }}>
                      {sortedHours.map((h) => slotLabel(h)).join(', ')}
                    </span>
                    <span className="text-gray-500 mx-2">·</span>
                    <span className="font-bold" style={{ color: '#1e3a5f' }}>{finalPrice.toLocaleString()}원</span>
                    {discount > 0 && <span className="ml-1 text-xs text-gray-400 line-through">{basePrice.toLocaleString()}원</span>}
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">날짜와 시간을 선택해주세요</span>
                )}
              </div>
              <button disabled={!canNext} onClick={() => setStep(2)}
                className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: canNext ? '0 4px 12px rgba(30,58,95,0.25)' : 'none' }}>
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: 예약 확인 ── */}
        {step === 2 && (
          <div>
            <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h3 className="text-base font-bold text-gray-900 mb-5">예약 정보 확인</h3>
              <div className="flex flex-col gap-0">
                {[
                  { label: '스터디룸',  value: room.name },
                  { label: '날짜',      value: date },
                  { label: '선택 시간', value: sortedHours.map((h) => slotLabel(h)).join(', ') },
                  { label: '총 시간',   value: `${totalHours}시간` },
                  { label: '최대 인원', value: `${room.capacity}명` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-sm text-gray-500">기본 요금</span>
                  <span className="text-sm text-gray-900">{basePrice.toLocaleString()}원</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <span className="text-sm text-gray-500">등급 할인 ({Math.round(discount * 100)}%)</span>
                    <span className="text-sm" style={{ color: '#16a34a' }}>-{(basePrice - finalPrice).toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between py-4 mt-1">
                  <span className="font-bold text-gray-900">최종 결제 금액</span>
                  <span className="text-xl font-bold" style={{ color: '#1e3a5f' }}>{finalPrice.toLocaleString()}원</span>
                </div>
              </div>
              <div className="mt-2 rounded-xl px-4 py-3 text-xs text-gray-500" style={{ background: '#f8fafc' }}>
                관리자 승인 후 예약이 확정됩니다. 취소는 마이페이지에서 가능합니다.
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
                ← 이전
              </button>
              <button onClick={handleToPayment} disabled={submitting}
                className="px-7 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}>
                {submitting ? '예약 생성 중...' : '결제하기 →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
