import { apiFetch } from './client'
import type { PageResponse, ReservationInsertRequest, ReservationResponse, ReservationStatus } from './types'

export function insertReservation(roomId: number, body: ReservationInsertRequest): Promise<ReservationResponse> {
  return apiFetch<ReservationResponse>(`/api/reservation/${roomId}`, { method: 'POST', body })
}

export function cancelReservation(id: number, reason: string): Promise<ReservationResponse> {
  return apiFetch<ReservationResponse>(`/api/reservation/${id}/cancel`, { method: 'POST', query: { reason } })
}

export function getMyReservations(): Promise<ReservationResponse[]> {
  return apiFetch<ReservationResponse[]>('/api/reservation/my')
}

export function getMyReservationById(id: number): Promise<ReservationResponse[]> {
  return apiFetch<ReservationResponse[]>(`/api/reservation/my/${id}`)
}

export function getOccupiedReservations(roomId: number): Promise<ReservationResponse[]> {
  return apiFetch<ReservationResponse[]>(`/api/reservation/possible/${roomId}`)
}

export function getReservationsByStatus(status: ReservationStatus): Promise<ReservationResponse[]> {
  return apiFetch<ReservationResponse[]>('/api/reservation/status', { query: { status } })
}

export function adminListReservations(page = 0, size = 1000): Promise<PageResponse<ReservationResponse>> {
  return apiFetch<PageResponse<ReservationResponse>>('/api/admin/reservation', { query: { page, size } })
}

export function adminConfirmReservation(id: number, status: ReservationStatus): Promise<ReservationResponse> {
  return apiFetch<ReservationResponse>(`/api/admin/reservation/${id}/confirm`, { method: 'POST', query: { status } })
}

export function adminRejectReservation(id: number, reason: string): Promise<ReservationResponse> {
  return apiFetch<ReservationResponse>(`/api/admin/reservation/${id}/reject`, { method: 'POST', query: { reason } })
}
