import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { StarRating as StarDisplay, StarPicker } from '../../components/rooms/StarRating'
import { useToast } from '../../context/ToastContext'
import * as roomsApi from '../../lib/api/rooms'
import * as reviewsApi from '../../lib/api/reviews'
import * as reservationsApi from '../../lib/api/reservations'
import { ApiError } from '../../lib/api/client'
import type { ReviewResponseDto, RoomResponseDto } from '../../lib/api/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export default function RoomReviewsPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { isAdmin, memberId } = useAuth()
  const { showToast } = useToast()
  const backPath = isAdmin ? '/admin/rooms' : '/user/rooms'

  const id = Number(roomId)
  const [room, setRoom] = useState<RoomResponseDto | null>(null)
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [canWrite, setCanWrite] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [roomData, reviewPage] = await Promise.all([
        roomsApi.getRoom(id),
        reviewsApi.getReviewsByRoom(id, 0, 100),
      ])
      setRoom(roomData)
      setReviews(reviewPage.content)

      if (!isAdmin && memberId !== null) {
        // reviewPage.content(최대 100개)를 훑어서 내 리뷰를 찾던 방식은 리뷰가 100개를 넘으면
        // 오판할 수 있어서, 전용 API(hasReviewed)로 교체했다.
        const [myReservations, alreadyReviewed] = await Promise.all([
          reservationsApi.getMyReservations(),
          reviewsApi.hasReviewed(id),
        ])
        const hasConfirmed = myReservations.some((r) => r.roomId === id && (r.status === 'CONFIRMED' || r.status === 'PAYMENT_DONE'))
        setCanWrite(hasConfirmed && !alreadyReviewed)
      }
    } catch {
      setRoom(null)
    } finally {
      setLoading(false)
    }
  }, [id, isAdmin, memberId])

  useEffect(() => { load() }, [load])

  const avg = reviews.length ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length : null

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  if (!room) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">방을 찾을 수 없습니다.</div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await reviewsApi.createReview({ roomId: id, rating, content: content.trim() })
      setContent('')
      setRating(5)
      setShowForm(false)
      showToast('리뷰가 등록되었습니다.', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '리뷰 등록에 실패했습니다.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          목록으로 돌아가기
        </button>

        {/* Room header */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.02em' }}>{room.name}</h1>
              <p className="text-sm text-gray-500">최대 {room.capacity}명 · {room.price.toLocaleString()}원/시간</p>
            </div>
            {avg !== null && (
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#f59e0b', letterSpacing: '-0.03em' }}>{avg.toFixed(1)}</div>
                <StarDisplay value={Math.round(avg)} />
                <div className="text-xs text-gray-400 mt-1">{reviews.length}개 리뷰</div>
              </div>
            )}
          </div>

          {/* Rating distribution */}
          {reviews.length > 0 && (
            <div className="mt-5 flex flex-col gap-1.5">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{star}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%', background: '#f59e0b' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write review button */}
        {canWrite && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold mb-6 flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', color: '#fff', boxShadow: '0 4px 12px rgba(30,58,95,0.25)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            리뷰 작성하기
          </button>
        )}

        {/* Review form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl p-6 mb-6" style={{ background: '#ffffff', border: '1.5px solid #bfdbfe', boxShadow: '0 4px 16px rgba(45,90,158,0.1)' }}>
            <h3 className="text-base font-bold text-gray-900 mb-4">리뷰 작성</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이용 후기를 작성해 주세요..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all"
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">
                취소
              </button>
              <button type="submit" disabled={submitting || !content.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: '#1e3a5f' }}>
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e8edf5' }}>
            아직 작성된 리뷰가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div className="flex items-start justify-between mb-2">
                  <StarDisplay value={review.rating} />
                  <span className="text-xs text-gray-400">{review.createdAt.slice(0, 10)}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
