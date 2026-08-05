import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, GRADE_CONFIG } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import * as roomsApi from '../../lib/api/rooms'
import * as wishlistsApi from '../../lib/api/wishlists'
import * as reservationsApi from '../../lib/api/reservations'
import { ApiError } from '../../lib/api/client'
import type { RoomResponseDto } from '../../lib/api/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export type Room = RoomResponseDto

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= value ? '#f59e0b' : '#e5e7eb'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

/* ─── 방 생성 다이얼로그 ─────────────────────────────── */

function CreateRoomDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (room: Room) => Promise<void> }) {
  const [name, setName]         = useState('')
  const [capacity, setCapacity] = useState('')
  const [price, setPrice]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')

  const canSubmit = name.trim() && Number(capacity) > 0 && Number(price) > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const created = await roomsApi.createRoom({ name: name.trim(), capacity: Number(capacity), price: Number(price) })
      await onCreate(created)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '방 추가에 실패했습니다.')
      setSubmitting(false)
    }
  }

  const fields = [
    { label: '방 이름', value: name, setter: setName, placeholder: '예) 세미나실 H', type: 'text' },
    { label: '수용 인원 (명)', value: capacity, setter: setCapacity, placeholder: '예) 6', type: 'number' },
    { label: '시간당 가격 (원)', value: price, setter: setPrice, placeholder: '예) 4000', type: 'number' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h2 className="text-base font-bold text-gray-900">새 방 추가</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
          )}
          {fields.map(({ label, value, setter, placeholder, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                placeholder={placeholder}
                min={type === 'number' ? 1 : undefined}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              />
            </div>
          ))}
        </form>
        <div className="flex gap-2 px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
            취소
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}
          >
            {submitting ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 수정 다이얼로그 ─────────────────────────────────── */

type EditForm = { name: string; capacity: string; price: string }

function EditRoomDialog({ room, onClose, onSave }: { room: Room; onClose: () => void; onSave: (id: number, form: EditForm) => Promise<void> }) {
  const [form, setForm] = useState<EditForm>({ name: room.name, capacity: String(room.capacity), price: String(room.price) })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof EditForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSubmitting(true)
    setError('')
    try {
      await onSave(room.id, form)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '수정에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h3 className="text-base font-bold text-gray-900">스터디룸 수정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2 rounded-xl text-xs font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
          )}
          {[
            { label: '방 이름', key: 'name' as const, type: 'text', placeholder: '세미나실 A' },
            { label: '수용 인원 (명)', key: 'capacity' as const, type: 'number', placeholder: '8' },
            { label: '시간당 요금 (원)', key: 'price' as const, type: 'number', placeholder: '5000' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type={type} value={form[key]} placeholder={placeholder}
                onChange={(e) => set(key)(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
            </div>
          ))}
        </div>

        <div className="flex gap-2 px-6 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
            취소
          </button>
          <button onClick={handleSave} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
            {submitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 갤러리 카드 ─────────────────────────────────── */

function RoomCard({
  room, isFav, isMyRoom, favCount, dp, avg, reviewCount, canReview, isAdmin, onFav, onReview, onEdit, onDelete, onReserve,
}: {
  room: Room; isFav: boolean; isMyRoom: boolean; favCount: number; dp: number | null
  avg: number | null; reviewCount: number; canReview: boolean; isAdmin: boolean
  onFav: () => void; onReview: () => void; onEdit: () => void; onDelete: () => void; onReserve: () => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md"
      style={{ background: isMyRoom ? '#f0f9ff' : '#fff', border: `1.5px solid ${isMyRoom ? '#bfdbfe' : '#e8edf5'}` }}>

      {/* 헤더 */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: isMyRoom ? '#dbeafe' : '#eff6ff', color: '#2d5a9e' }}>{room.id}</div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={onReview} className="text-sm font-bold text-gray-900 hover:text-blue-700 transition-colors">{room.name}</button>
              {isMyRoom && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>예약함</span>}
            </div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#4b6a8a' }}>최대 {room.capacity}명</div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <button onClick={onFav} className="p-1.5 rounded-lg transition-all hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#f59e0b' : 'none'} stroke={isFav ? '#f59e0b' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          <span className="text-[10px] font-semibold leading-none tabular-nums" style={{ color: isFav ? '#b45309' : '#94a3b8' }}>{favCount}</span>
        </div>
      </div>

      {/* 가격 + 평점 */}
      <div className="px-5 pb-3 flex items-center justify-between">
        <div>
          {dp !== null ? (
            <div>
              <span className="text-base font-bold text-gray-900">{dp.toLocaleString()}원</span>
              <span className="ml-1.5 text-xs text-gray-400 line-through">{room.price.toLocaleString()}원</span>
              <span className="ml-1 text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: '#fee2e2', color: '#dc2626' }}>
                -{Math.round((1 - dp / room.price) * 100)}%
              </span>
            </div>
          ) : (
            <span className="text-base font-semibold text-gray-900">{room.price.toLocaleString()}원</span>
          )}
        </div>
        {avg !== null ? (
          <div className="text-right">
            <StarRating value={Math.round(avg)} />
            <div className="text-[10px] text-gray-400 mt-0.5">{avg.toFixed(1)} ({reviewCount}개)</div>
          </div>
        ) : <span className="text-xs text-gray-300">리뷰 없음</span>}
      </div>

      {/* 하단 버튼 */}
      <div className="px-5 pb-4 mt-auto flex gap-2">
        {isAdmin ? (
          <>
            <button onClick={onEdit} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: '#eff6ff', color: '#2d5a9e', border: '1px solid #bfdbfe' }}>수정</button>
            <button onClick={onDelete} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>삭제</button>
          </>
        ) : (
          <>
            <button onClick={onReserve}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>예약하기</button>
            {canReview && (
              <button onClick={onReview} className="py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>리뷰</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── 메인 페이지 ─────────────────────────────────── */

export default function AdminRoomsPage() {
  const { isAdmin, grade } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteMap, setFavoriteMap] = useState<Record<number, number>>({}) // roomId -> wishlistId
  const [favCounts, setFavCounts] = useState<Record<number, number>>({})
  const [ratings, setRatings] = useState<Record<number, { avg: number | null; count: number }>>({})
  const [myRoomIds, setMyRoomIds] = useState<Set<number>>(new Set())
  const [reviewableRoomIds, setReviewableRoomIds] = useState<Set<number>>(new Set())
  const [showCreate, setShowCreate] = useState(false)

  const [searchName, setSearchName]     = useState('')
  const [maxPrice, setMaxPrice]         = useState('')
  const [minCapacity, setMinCapacity]   = useState('')
  const [viewMode, setViewMode]         = useState<'list' | 'gallery'>('list')
  const [editRoom, setEditRoom]         = useState<Room | null>(null)

  // 입력창(searchName/maxPrice/minCapacity)은 타이핑마다 바뀌지만, 실제 서버 요청은 300ms
  // 디바운스된 값(debouncedName/debouncedPrice/debouncedCapacity)으로만 나간다. 페이지 이동(page)은
  // 이미 확정된 검색어에 대해 다른 페이지를 요청하는 것이므로 디바운스를 거치지 않고 즉시 반영한다.
  const [debouncedName, setDebouncedName]         = useState('')
  const [debouncedPrice, setDebouncedPrice]       = useState('')
  const [debouncedCapacity, setDebouncedCapacity] = useState('')
  const [page, setPage]                 = useState(0)             // 0-indexed, 백엔드와 동일
  const [totalPages, setTotalPages]     = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const PAGE_SIZE = 20 // 백엔드 기본값과 동일하게 고정

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(searchName)
      setDebouncedPrice(maxPrice)
      setDebouncedCapacity(minCapacity)
      setPage(0) // 검색어가 바뀌면 항상 첫 페이지부터 다시 봄
    }, 300)
    return () => clearTimeout(timer)
  }, [searchName, maxPrice, minCapacity])

  const loadRoomList = useCallback(async (name: string, price: string, capacity: string, pageNumber: number) => {
    setLoading(true)
    try {
      // name/capacity/price 전부 백엔드에 그대로 위임한다.
      // price는 원가(room.price) 기준으로 필터링되며, 등급 할인은 서버 필터링에 반영되지 않는다.
      const result = await roomsApi.searchRoomsWithPaging({
        name: name.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        price: price ? Number(price) : undefined,
        page: pageNumber,
        size: PAGE_SIZE,
      })
      const list = result.content
      setRooms(list)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)

      // room 목록 응답에 이미 room별 wishlistCount/averageRating/reviewCount가
      // 배치 쿼리로 채워져서 오기 때문에, room마다 별도 API를 호출할 필요가 없다.
      const nextCounts: Record<number, number> = {}
      const nextRatings: Record<number, { avg: number | null; count: number }> = {}
      list.forEach((r) => {
        nextCounts[r.id] = r.wishlistCount
        nextRatings[r.id] = r.reviewCount > 0 ? { avg: r.averageRating, count: r.reviewCount } : { avg: null, count: 0 }
      })
      setFavCounts(nextCounts)
      setRatings(nextRatings)
    } catch {
      showToast('스터디룸 목록을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // 찜 목록/내 예약 정보는 검색어와 무관하게 화면 진입 시 한 번만 필요하므로,
  // room 목록 검색(loadRoomList)과 분리해서 별도로 로드한다.
  const loadUserExtras = useCallback(async () => {
    if (isAdmin) return
    try {
      const [wishlist, myReservations] = await Promise.all([
        wishlistsApi.getWishlists(),
        reservationsApi.getMyReservations(),
      ])
      // DELETE /api/wishlists/{roomId} 는 wishlist 자체의 id가 아니라 roomId를 받으므로,
      // wishlist의 PK(w.id)가 아니라 roomId를 값으로 저장한다.
      const nextFavMap: Record<number, number> = {}
      wishlist.forEach((w) => { nextFavMap[w.roomId] = w.roomId })
      setFavoriteMap(nextFavMap)

      const myRooms = new Set(myReservations.map((r) => r.roomId))
      setMyRoomIds(myRooms)
      setReviewableRoomIds(new Set(myReservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PAYMENT_DONE').map((r) => r.roomId)))
    } catch {
      showToast('찜/예약 정보를 불러오지 못했습니다.', 'error')
    }
  }, [isAdmin, showToast])

  // 화면 진입 시 1회만 로드 (검색어와 무관)
  useEffect(() => { loadUserExtras() }, [loadUserExtras])

  // 검색어는 위 effect에서 이미 디바운스됐으므로, 여기서는 추가 지연 없이 즉시 조회한다.
  // (검색어 변경 시 debounced* 값들이 바뀌면서 page도 0으로 리셋되고,
  //  페이지네이션 버튼 클릭 시에는 page만 바뀌므로 역시 이 effect가 즉시 재조회한다.)
  useEffect(() => {
    loadRoomList(debouncedName, debouncedPrice, debouncedCapacity, page)
  }, [debouncedName, debouncedPrice, debouncedCapacity, page, loadRoomList])

  const discountRate = grade ? GRADE_CONFIG[grade].discount : 0

  // name/capacity/price 전부 이미 loadRoomList에서 서버 검색으로 걸러졌으므로,
  // 화면에는 rooms를 그대로 사용한다 (별도 클라이언트 필터 없음).

  const toggleFavorite = async (room: Room) => {
    const isFavorited = favoriteMap[room.id] !== undefined
    try {
      if (isFavorited) {
        // DELETE /api/wishlists/{roomId} - roomId를 그대로 넘긴다 (wishlist 자체 id 아님)
        await wishlistsApi.removeWishlist(room.id)
        setFavoriteMap((m) => { const next = { ...m }; delete next[room.id]; return next })
        setFavCounts((c) => ({ ...c, [room.id]: Math.max(0, (c[room.id] ?? 1) - 1) }))
      } else {
        await wishlistsApi.addWishlist({ roomId: room.id })
        setFavoriteMap((m) => ({ ...m, [room.id]: room.id }))
        setFavCounts((c) => ({ ...c, [room.id]: (c[room.id] ?? 0) + 1 }))
      }
    } catch {
      showToast('즐겨찾기 처리에 실패했습니다.', 'error')
    }
  }

  const handleDelete = async (room: Room) => {
    try {
      await roomsApi.deleteRoom(room.id)
      setRooms((prev) => prev.filter((r) => r.id !== room.id))
      showToast('방이 삭제되었습니다.', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '삭제에 실패했습니다.', 'error')
    }
  }

  const rowProps = (room: Room) => {
    const dp = room.discountedPrice < room.price ? room.discountedPrice : null
    const rating = ratings[room.id]
    return {
      room,
      isFav:       favoriteMap[room.id] !== undefined,
      isMyRoom:    !isAdmin && myRoomIds.has(room.id),
      favCount:    favCounts[room.id] ?? 0,
      dp,
      avg:         rating?.avg ?? null,
      reviewCount: rating?.count ?? 0,
      canReview:   !isAdmin && reviewableRoomIds.has(room.id),
      isAdmin,
      onFav:       () => toggleFavorite(room),
      onReview:    () => navigate(`${isAdmin ? '/admin' : '/user'}/rooms/${room.id}/reviews`),
      onEdit:      () => setEditRoom(room),
      onDelete:    () => handleDelete(room),
      onReserve:   () => navigate(`/user/rooms/${room.id}/reserve`),
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {showCreate && (
        <CreateRoomDialog
          onClose={() => setShowCreate(false)}
          onCreate={async (room) => { setRooms((prev) => [...prev, room]); setShowCreate(false); showToast('방이 추가되었습니다.', 'success') }}
        />
      )}
      {editRoom && (
        <EditRoomDialog
          room={editRoom}
          onClose={() => setEditRoom(null)}
          onSave={async (id, form) => {
            const updated = await roomsApi.updateRoom(id, { name: form.name.trim(), capacity: Number(form.capacity), price: Number(form.price) })
            setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)))
            setEditRoom(null)
            showToast('방 정보가 수정되었습니다.', 'success')
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>스터디룸 목록</h1>
            <p className="text-sm text-gray-500 mt-1">전체 {totalElements}개의 방</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 갤러리/리스트 토글 */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>
              {(['list', 'gallery'] as const).map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className="px-3 py-2 transition-all"
                  style={{ background: viewMode === m ? '#1e3a5f' : '#fff', color: viewMode === m ? '#fff' : '#94a3b8' }}>
                  {m === 'list' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 12px rgba(30,58,95,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                방 추가
              </button>
            )}
          </div>
        </div>

        {/* 할인 배너 */}
        {!isAdmin && grade && discountRate > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm font-medium"
            style={{ background: GRADE_CONFIG[grade].bg, color: GRADE_CONFIG[grade].color, border: `1px solid ${GRADE_CONFIG[grade].color}22` }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span><b>{GRADE_CONFIG[grade].label}</b> 등급 혜택: 모든 방 <b>{Math.round(discountRate * 100)}% 할인</b> 적용 중</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: '전체', value: totalElements, color: '#2d5a9e', bg: '#eff6ff' },
            { label: '즐겨찾기', value: Object.keys(favoriteMap).length, color: '#b45309', bg: '#fffbeb' },
            { label: '이 페이지 표시', value: rooms.length, color: '#16a34a', bg: '#f0fdf4' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className="text-xs font-medium text-gray-500 mb-1">{s.label}</div>
              <div className="text-3xl font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 검색·필터 */}
        <div className="rounded-2xl p-4 mb-5 flex flex-col gap-3" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </div>
              <input type="text" placeholder="방 이름 검색" value={searchName} onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
            </div>
            <div className="relative min-w-[150px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs font-medium">₩</div>
              <input type="number" placeholder="최대 가격 (원)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm placeholder-gray-400 outline-none"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
            </div>
            <div className="relative min-w-[150px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <input type="number" placeholder="최소 인원 (명)" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm placeholder-gray-400 outline-none"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
            </div>
          </div>
        </div>

        {/* ─── 갤러리 뷰 ─── */}
        {viewMode === 'gallery' ? (
          rooms.length === 0
            ? <div className="text-center py-16 text-sm text-gray-400">검색 결과가 없습니다</div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{rooms.map((room) => <RoomCard key={room.id} {...rowProps(room)} />)}</div>
        ) : (
        /* ─── 리스트 뷰 ─── */
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {/* 모바일: 카드 스택 */}
          <div className="md:hidden">
            {rooms.length === 0
              ? <div className="text-center py-16 text-sm text-gray-400">검색 결과가 없습니다</div>
              : <div className="p-3 flex flex-col gap-3">{rooms.map((room) => <RoomCard key={room.id} {...rowProps(room)} />)}</div>
            }
          </div>
          {/* 데스크톱: 테이블 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
                  {['', '방 이름', '가격', '평점', ...(isAdmin ? ['관리'] : ['예약 / 리뷰'])].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-sm text-gray-400">검색 결과가 없습니다</td></tr>
                ) : rooms.map((room, i) => {
                  const p  = rowProps(room)
                  const dp = p.dp
                  return (
                    <tr key={room.id} className="transition-colors"
                      style={{ borderBottom: i < rooms.length - 1 ? '1px solid #f1f5f9' : 'none', background: p.isMyRoom ? '#f0f9ff' : '#fff' }}>
                      {/* 즐겨찾기 */}
                      <td className="pl-4 pr-1 py-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <button onClick={p.onFav} className="p-1.5 rounded-lg transition-all hover:scale-110">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={p.isFav ? '#f59e0b' : 'none'} stroke={p.isFav ? '#f59e0b' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                          <span className="text-[10px] font-semibold tabular-nums leading-none" style={{ color: p.isFav ? '#b45309' : '#94a3b8' }}>{p.favCount}</span>
                        </div>
                      </td>
                      {/* 방 이름 */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                            style={{ background: p.isMyRoom ? '#dbeafe' : '#eff6ff', color: '#2d5a9e' }}>{room.id}</div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button onClick={p.onReview} className="text-sm font-semibold text-gray-900 hover:text-blue-700 transition-colors">{room.name}</button>
                              {p.isMyRoom && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>예약함</span>}
                            </div>
                            <div className="text-xs font-medium mt-0.5" style={{ color: '#4b6a8a' }}>최대 {room.capacity}명</div>
                          </div>
                        </div>
                      </td>
                      {/* 가격 */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {dp !== null ? (
                          <div>
                            <div className="text-sm font-bold text-gray-900">{dp.toLocaleString()}원</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs text-gray-400 line-through">{room.price.toLocaleString()}원</span>
                              <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                -{Math.round((1 - dp / room.price) * 100)}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-gray-900">{room.price.toLocaleString()}원</div>
                        )}
                      </td>
                      {/* 평점 */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {p.avg !== null ? (
                          <div><StarRating value={Math.round(p.avg)} /><div className="text-xs text-gray-400 mt-0.5">{p.avg.toFixed(1)} ({p.reviewCount}개)</div></div>
                        ) : <span className="text-xs text-gray-300">없음</span>}
                      </td>
                      {/* 관리/리뷰 */}
                      {isAdmin ? (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={p.onEdit} className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-all" title="수정">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button onClick={p.onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="삭제">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      ) : (
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <button onClick={p.onReserve}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
                              예약
                            </button>
                            {p.canReview
                              ? <button onClick={p.onReview} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ background: '#eff6ff', color: '#2d5a9e', border: '1px solid #bfdbfe' }}>리뷰</button>
                              : <span className="text-xs text-gray-300 whitespace-nowrap">리뷰 불가</span>}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#f8fafc', borderTop: '1px solid #e8edf5' }}>
            <span className="text-xs text-gray-400">이 페이지 {rooms.length}개 (전체 {totalElements}개)</span>
          </div>
        </div>
        )}

        {/* 페이지네이션 - 리스트/갤러리 뷰 공통 (백엔드 기본 size=20 기준) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid #e2e8f0', color: '#475569' }}>
              이전
            </button>
            <span className="text-xs text-gray-500 px-2">
              {page + 1} / {totalPages} 페이지
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid #e2e8f0', color: '#475569' }}>
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
