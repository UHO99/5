import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import * as roomsApi from '../../lib/api/rooms'
import * as reviewsApi from '../../lib/api/reviews'
import * as wishlistsApi from '../../lib/api/wishlists'
import * as reservationsApi from '../../lib/api/reservations'
import type { ReviewResponseDto, RoomResponseDto } from '../../lib/api/types'
import { StarRating } from '../../components/rooms/StarRating'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'

export default function RoomDetailPage() {
  const { roomId } = useParams()
  const navigate   = useNavigate()
  const { isAdmin } = useAuth()
  const { showToast } = useToast()

  const id = Number(roomId)
  const [loading, setLoading]   = useState(true)
  const [room, setRoom]         = useState<RoomResponseDto | null>(null)
  const [reviews, setReviews]   = useState<ReviewResponseDto[]>([])
  const [isFavorited, setIsFavorited] = useState(false)
  const [favCount, setFavCount] = useState(0)
  const [hasConfirmed, setHasConfirmed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // room 상세 응답(getRoom)에 이미 이 사용자의 찜 여부(wishlisted)와 찜 개수(wishlistCount)가
      // 배치 쿼리로 채워져서 오므로, countWishlistByRoom/getWishlists를 별도로 호출할 필요가 없다.
      const [roomData, reviewPage] = await Promise.all([
        roomsApi.getRoom(id),
        reviewsApi.getReviewsByRoom(id, 0, 3),
      ])
      setRoom(roomData)
      setReviews(reviewPage.content)
      setFavCount(roomData.wishlistCount)
      setIsFavorited(roomData.wishlisted)

      if (!isAdmin) {
        const myReservations = await reservationsApi.getMyReservations()
        setHasConfirmed(myReservations.some((r) => r.roomId === id && (r.status === 'CONFIRMED' || r.status === 'PAYMENT_DONE')))
      }
    } catch {
      setRoom(null)
    } finally {
      setLoading(false)
    }
  }, [id, isAdmin])

  useEffect(() => { load() }, [load])

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        // DELETE /api/wishlists/{roomId} - roomId(id)를 그대로 넘긴다 (wishlist 자체 id 아님)
        await wishlistsApi.removeWishlist(id)
        setIsFavorited(false)
        setFavCount((c) => Math.max(0, c - 1))
      } else {
        await wishlistsApi.addWishlist({ roomId: id })
        setIsFavorited(true)
        setFavCount((c) => c + 1)
      }
    } catch {
      showToast('즐겨찾기 처리에 실패했습니다.', 'error')
    }
  }

  const discountedPrice = room && room.discountedPrice < room.price ? room.discountedPrice : null
  const discount = room && room.price > 0 ? 1 - room.discountedPrice / room.price : 0
  const avgRating = reviews.length ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length : null

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="룸을 찾을 수 없습니다"
          description="요청하신 스터디룸이 존재하지 않습니다."
          action={{ label: '목록으로', onClick: () => navigate('/user/rooms') }}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* 뒤로가기 */}
        <button onClick={() => navigate('/user/rooms')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          목록으로 돌아가기
        </button>

        {/* Hero 카드 */}
        <div className="rounded-2xl p-5 md:p-6 mb-4" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', color: '#fff' }}>
                {room.id}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{room.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">최대 {room.capacity}명</span>
                </div>
              </div>
            </div>
            {/* 위시리스트 */}
            {!isAdmin && (
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <button onClick={toggleFavorite} className="p-2 rounded-xl hover:bg-gray-50 transition-all hover:scale-110">
                  <svg width="22" height="22" viewBox="0 0 24 24"
                    fill={isFavorited ? '#f59e0b' : 'none'} stroke={isFavorited ? '#f59e0b' : '#cbd5e1'} strokeWidth="2" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: isFavorited ? '#b45309' : '#94a3b8' }}>{favCount}</span>
              </div>
            )}
          </div>

          {/* 가격 */}
          <div className="mt-4 pt-4 flex items-end justify-between" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div>
              {discountedPrice !== null ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{discountedPrice.toLocaleString()}원</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#fee2e2', color: '#dc2626' }}>-{Math.round(discount * 100)}%</span>
                  </div>
                  <span className="text-sm text-gray-400 line-through">{room.price.toLocaleString()}원/시간</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-900">{room.price.toLocaleString()}원<span className="text-sm font-normal text-gray-400">/시간</span></span>
              )}
            </div>
            {avgRating !== null && (
              <div className="text-right">
                <StarRating value={Math.round(avgRating)} size={14} />
                <div className="text-xs text-gray-400 mt-0.5">{avgRating.toFixed(1)} ({reviews.length}개 리뷰)</div>
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">리뷰</h2>
            <button onClick={() => navigate(`/user/rooms/${id}/reviews`)}
              className="text-xs font-medium transition-colors hover:opacity-80" style={{ color: '#2d5a9e' }}>
              전체 보기 →
            </button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 리뷰가 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.slice(0, 3).map((rv) => (
                <div key={rv.id} className="rounded-xl p-4" style={{ background: '#f8fafc' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <StarRating value={rv.rating} size={12} />
                    <span className="text-xs text-gray-400">{rv.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{rv.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {!isAdmin && (
          <div className="flex gap-3">
            {hasConfirmed && (
              <button onClick={() => navigate(`/user/rooms/${id}/reviews`)}
                className="flex-none px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
                리뷰 작성
              </button>
            )}
            <button
              onClick={() => navigate(`/user/rooms/${id}/reserve`)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}>
              예약하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
