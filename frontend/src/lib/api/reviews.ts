import { apiFetch } from './client'
import type { PageResponse, ReviewCreateRequest, ReviewResponseDto, ReviewUpdateRequest } from './types'

export function createReview(body: ReviewCreateRequest): Promise<ReviewResponseDto> {
  return apiFetch<ReviewResponseDto>('/api/reviews', { method: 'POST', body })
}

export function updateReview(id: number, body: ReviewUpdateRequest): Promise<ReviewResponseDto> {
  return apiFetch<ReviewResponseDto>(`/api/reviews/${id}`, { method: 'PATCH', body })
}

export function deleteReview(id: number): Promise<void> {
  return apiFetch<void>(`/api/reviews/${id}`, { method: 'DELETE' })
}

export function getReviewsByRoom(roomId: number, page = 0, size = 20): Promise<PageResponse<ReviewResponseDto>> {
  return apiFetch<PageResponse<ReviewResponseDto>>(`/api/reviews/room/${roomId}`, { query: { page, size } })
}

export function getReviewsByMember(memberId: number): Promise<ReviewResponseDto[]> {
  return apiFetch<ReviewResponseDto[]>(`/api/reviews/member/${memberId}`)
}

/** GET /api/reviews/room/{roomId}/reviewed - 이 room에 이미 리뷰를 남겼는지 여부만 확인 */
export function hasReviewed(roomId: number): Promise<boolean> {
  return apiFetch<boolean>(`/api/reviews/room/${roomId}/reviewed`)
}
