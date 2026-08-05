import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useAuth, GRADE_CONFIG } from '../../context/AuthContext'
import { StarRating, StarPicker } from '../../components/rooms/StarRating'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../context/ToastContext'
import * as membersApi from '../../lib/api/members'
import * as reviewsApi from '../../lib/api/reviews'
import * as roomsApi from '../../lib/api/rooms'
import { ApiError } from '../../lib/api/client'
import type { ReviewResponseDto, RoomResponseDto } from '../../lib/api/types'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

type Tab = 'profile' | 'reviews'

/* 회원 탈퇴 확인 모달 */
function DeleteAccountModal({ onConfirm, onClose }: { onConfirm: (password: string) => Promise<void>; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '탈퇴 처리에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="px-6 py-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ background: '#fef2f2' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 text-center mb-1">정말 탈퇴하시겠습니까?</h3>
          <p className="text-xs text-gray-500 text-center mb-5">탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.<br />확인을 위해 "탈퇴합니다"와 비밀번호를 입력해주세요.</p>
          {error && (
            <div className="mb-3 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>
          )}
          <input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="탈퇴합니다"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none mb-2"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none mb-4"
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-all">취소</button>
            <button disabled={input !== '탈퇴합니다' || !password || submitting} onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
              {submitting ? '처리 중...' : '탈퇴 확정'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface EnrichedReview {
  review: ReviewResponseDto
  roomName: string
}

export default function MyPage() {
  const { username, name, email, grade, memberId, updateProfile, logout } = useAuth()
  const navigate    = useNavigate()
  const { showToast } = useToast()

  const [tab, setTab] = useState<Tab>('profile')
  const [editName, setEditName] = useState(name)
  const [editEmail, setEditEmail] = useState(email)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const [reviews, setReviews] = useState<EnrichedReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [editingId, setEditingId]     = useState<number | null>(null)
  const [editRating, setEditRating]   = useState(5)
  const [editContent, setEditContent] = useState('')

  useEffect(() => { setEditName(name); setEditEmail(email) }, [name, email])

  const loadReviews = useCallback(async () => {
    if (memberId === null) return
    setReviewsLoading(true)
    try {
      const list = await reviewsApi.getReviewsByMember(memberId)
      const roomCache = new Map<number, RoomResponseDto>()
      const uniqueRoomIds = [...new Set(list.map((r) => r.roomId))]
      // 중복 제거된 roomId 목록을 배치 조회 1번으로 가져온다.
      // (findByIdIn은 삭제된 방 등 없는 id는 조용히 빼고 반환하므로, 기존의 개별 try/catch와 동일한
      //  효과를 별도 에러 처리 없이 얻는다)
      const rooms = await roomsApi.getRoomsByIds(uniqueRoomIds)
      rooms.forEach((room) => roomCache.set(room.id, room))
      setReviews(list.map((review) => ({ review, roomName: roomCache.get(review.roomId)?.name ?? `방 #${review.roomId}` })))
    } catch {
      showToast('리뷰 목록을 불러오지 못했습니다.', 'error')
    } finally {
      setReviewsLoading(false)
    }
  }, [memberId, showToast])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(editName, editEmail)
      showToast('프로필이 저장되었습니다.', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '프로필 저장에 실패했습니다.', 'error')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (memberId === null) return
    setPasswordSubmitting(true)
    try {
      await membersApi.changePassword(memberId, { currentPassword, newPassword })
      setCurrentPassword(''); setNewPassword('')
      showToast('비밀번호가 변경되었습니다.', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '비밀번호 변경에 실패했습니다.', 'error')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const startEdit = (id: number, rating: number, content: string) => {
    setEditingId(id); setEditRating(rating); setEditContent(content)
  }

  const saveEdit = async () => {
    if (editingId === null) return
    try {
      await reviewsApi.updateReview(editingId, { rating: editRating, content: editContent })
      setEditingId(null)
      showToast('리뷰가 수정되었습니다.', 'success')
      await loadReviews()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '리뷰 수정에 실패했습니다.', 'error')
    }
  }

  const removeReview = async (id: number) => {
    try {
      await reviewsApi.deleteReview(id)
      showToast('리뷰가 삭제되었습니다.', 'success')
      await loadReviews()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '리뷰 삭제에 실패했습니다.', 'error')
    }
  }

  const handleDeleteAccount = async (password: string) => {
    if (memberId === null) return
    await membersApi.withdraw(memberId, { password })
    setShowDeleteModal(false)
    await logout()
    navigate('/login')
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'profile', label: '회원 정보', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      key: 'reviews', label: '내 리뷰', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {showDeleteModal && (
        <DeleteAccountModal onConfirm={handleDeleteAccount} onClose={() => setShowDeleteModal(false)} />
      )}

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>마이페이지</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{username} 님</p>
              {grade && <Badge variant="grade" value={grade} />}
              {grade && (
                <span className="text-xs text-gray-400">· {Math.round(GRADE_CONFIG[grade].discount * 100)}% 할인 적용</span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Sidebar tabs */}
            <div className="md:w-44 shrink-0">
              <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {tabs.map((t) => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                    style={{
                      background: tab === t.key ? '#eff6ff' : 'transparent',
                      color: tab === t.key ? '#1e3a5f' : '#6b7280',
                    }}>
                    <span style={{ color: tab === t.key ? '#2d5a9e' : '#9ca3af' }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {tab === 'profile' && (
                <div className="flex flex-col gap-4">
                  {/* Quick Links */}
                  <div className="rounded-2xl p-4 flex gap-3" style={{ background: '#fff', border: '1px solid #e8edf5' }}>
                    <button onClick={() => navigate('/user/reservations')}
                      className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-gray-50"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d5a9e" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">예약 내역</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <button onClick={() => navigate('/user/wishlist')}
                      className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-gray-50"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">위시리스트</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>

                  {/* 프로필 수정 */}
                  <div className="rounded-2xl p-5 md:p-6" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h2 className="text-base font-bold text-gray-900 mb-4">회원 정보 수정</h2>
                    <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
                        <input value={username} disabled className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-400 outline-none" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                          style={{ background: '#fff', border: '1.5px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                          style={{ background: '#fff', border: '1.5px solid #e2e8f0' }} />
                      </div>
                      <button type="submit"
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white self-start transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 12px rgba(30,58,95,0.25)' }}>
                        저장하기
                      </button>
                    </form>
                  </div>

                  {/* 비밀번호 변경 */}
                  <div className="rounded-2xl p-5 md:p-6" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h2 className="text-base font-bold text-gray-900 mb-4">비밀번호 변경</h2>
                    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">현재 비밀번호</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                          style={{ background: '#fff', border: '1.5px solid #e2e8f0' }} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all"
                          style={{ background: '#fff', border: '1.5px solid #e2e8f0' }} />
                      </div>
                      <button type="submit" disabled={passwordSubmitting || !currentPassword || !newPassword}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white self-start transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 12px rgba(30,58,95,0.25)' }}>
                        {passwordSubmitting ? '변경 중...' : '비밀번호 변경'}
                      </button>
                    </form>
                  </div>

                  {/* 회원 탈퇴 */}
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #fecaca' }}>
                    <h2 className="text-sm font-bold mb-1" style={{ color: '#b91c1c' }}>위험 구역</h2>
                    <p className="text-xs text-gray-500 mb-3">탈퇴 시 모든 예약 내역과 리뷰가 삭제되며 복구할 수 없습니다.</p>
                    <button onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      회원 탈퇴
                    </button>
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div className="px-5 py-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
                    <h2 className="text-base font-bold text-gray-900">내 리뷰 ({reviews.length})</h2>
                  </div>
                  {reviewsLoading ? (
                    <div className="py-16 bg-white"><LoadingSpinner size="md" /></div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-16 text-sm text-gray-400 bg-white">작성한 리뷰가 없습니다.</div>
                  ) : (
                    <div className="divide-y bg-white" style={{ borderColor: '#f1f5f9' }}>
                      {reviews.map(({ review: rv, roomName }) => (
                        <div key={rv.id} className="px-5 py-4">
                          {editingId === rv.id ? (
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-3">{roomName}</div>
                              <div className="mb-3"><StarPicker value={editRating} onChange={setEditRating} /></div>
                              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                rows={3} className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none resize-none mb-3"
                                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
                              <div className="flex gap-2">
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-all">취소</button>
                                <button onClick={saveEdit} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: '#1e3a5f' }}>저장</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900">{roomName}</span>
                                  <StarRating value={rv.rating} size={12} />
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{rv.content}</p>
                                <div className="text-xs text-gray-400 mt-1">{rv.createdAt.slice(0, 10)}</div>
                              </div>
                              <div className="flex gap-1 ml-4 shrink-0">
                                <button onClick={() => startEdit(rv.id, rv.rating, rv.content)} className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-all">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button onClick={() => removeReview(rv.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
