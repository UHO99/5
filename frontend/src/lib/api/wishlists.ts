import { apiFetch } from './client'
import type { WishlistCreateRequest, WishlistResponseDto } from './types'

export function getWishlists(): Promise<WishlistResponseDto[]> {
  return apiFetch<WishlistResponseDto[]>('/api/wishlists')
}

export function addWishlist(body: WishlistCreateRequest): Promise<WishlistResponseDto> {
  return apiFetch<WishlistResponseDto>('/api/wishlists', { method: 'POST', body })
}

export function removeWishlist(id: number): Promise<void> {
  return apiFetch<void>(`/api/wishlists/${id}`, { method: 'DELETE' })
}

export function countWishlistByRoom(roomId: number): Promise<number> {
  return apiFetch<number>(`/api/wishlists/room/${roomId}`)
}

/** GET /api/wishlists/exists - 이 room을 이미 찜했는지 여부만 확인 (전체 목록을 안 가져와도 됨) */
export function isWishlisted(roomId: number): Promise<boolean> {
  return apiFetch<boolean>('/api/wishlists/exists', { query: { roomId } })
}
