import { apiFetch } from './client'
import type { PageResponse, RoomCreateRequest, RoomResponseDto, RoomUpdateRequest } from './types'

export function listRooms(page = 0, size = 100): Promise<PageResponse<RoomResponseDto>> {
  return apiFetch<PageResponse<RoomResponseDto>>('/api/rooms', { query: { page, size } })
}

export function getRoom(id: number): Promise<RoomResponseDto> {
  return apiFetch<RoomResponseDto>(`/api/rooms/${id}`)
}

export function createRoom(body: RoomCreateRequest): Promise<RoomResponseDto> {
  return apiFetch<RoomResponseDto>('/api/rooms', { method: 'POST', body })
}

export function updateRoom(id: number, body: RoomUpdateRequest): Promise<RoomResponseDto> {
  return apiFetch<RoomResponseDto>(`/api/rooms/${id}`, { method: 'PATCH', body })
}

export function deleteRoom(id: number): Promise<void> {
  return apiFetch<void>(`/api/rooms/${id}`, { method: 'DELETE' })
}

/**
 * GET /api/rooms/search/page
 * name/capacity/price 전부 백엔드에 그대로 위임한다.
 * price(최대 가격)는 백엔드가 원가(room.price) 기준으로 필터링하며, 등급 할인은 반영되지 않는다.
 * (예: 원가 12만원인 방이 등급 할인으로 실제 10.2만원이 되어도, "최대 가격 10만원" 검색에서는
 *  원가 12만원 기준으로 판단되어 제외된다.)
 */
export function searchRoomsWithPaging(
  params: { name?: string; capacity?: number; price?: number; page?: number; size?: number },
): Promise<PageResponse<RoomResponseDto>> {
  const { name, capacity, price, page = 0, size = 100 } = params
  return apiFetch<PageResponse<RoomResponseDto>>('/api/rooms/search/page', {
    query: { name, capacity, price, page, size },
  })
}

/**
 * GET /api/rooms/batch
 * ids를 comma로 이어붙인 하나의 쿼리 파라미터로 보낸다 (예: ?ids=5,3,8).
 * Spring MVC는 List<Long> 파라미터에 콤마로 구분된 단일 문자열이 오면 자동으로 분리해서 바인딩하므로
 * client.ts의 배열 쿼리 파라미터 지원 없이도 그대로 동작한다.
 * 응답 순서는 요청한 ids 순서와 다를 수 있으므로, 호출부에서는 항상 id 기준(Map)으로 매칭해야 한다.
 */
export function getRoomsByIds(ids: number[]): Promise<RoomResponseDto[]> {
  if (ids.length === 0) return Promise.resolve([])
  return apiFetch<RoomResponseDto[]>('/api/rooms/batch', { query: { ids: ids.join(',') } })
}
