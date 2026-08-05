import type { ReservationStatus as ServerReservationStatus } from './api/types'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'payment_done' | 'rejected'

const SERVER_TO_UI: Record<ServerReservationStatus, ReservationStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  PAYMENT_DONE: 'payment_done',
  REJECTED: 'rejected',
}

const UI_TO_SERVER: Record<ReservationStatus, ServerReservationStatus> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  cancelled: 'CANCELLED',
  payment_done: 'PAYMENT_DONE',
  rejected: 'REJECTED',
}

export function toUiStatus(status: ServerReservationStatus): ReservationStatus {
  return SERVER_TO_UI[status]
}

export function toServerStatus(status: ReservationStatus): ServerReservationStatus {
  return UI_TO_SERVER[status]
}
