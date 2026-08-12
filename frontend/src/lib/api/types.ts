// api-docs.json 스키마를 기반으로 한 타입 정의

export interface ResultDto<T> {
  message: string
  data: T
}

export interface Pageable {
  page?: number
  size?: number
  sort?: string[]
}

export interface PageResponse<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

/* ── Auth ── */
export interface SignupRequest {
  username: string
  password: string
  email: string
  name: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface ReissueRequest {
  refreshToken: string
}

export interface FindUsernameRequest {
  name: string
  email: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

/* ── Member ── */
export type Role = 'USER' | 'ADMIN'
export type Grade = 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP'

export interface MemberResponse {
  id: number
  username: string
  email: string
  name: string
  role: Role
  grade: Grade
}

export interface MemberUpdateRequest {
  name: string
  email: string
}

export interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
}

export interface WithdrawRequest {
  password: string
}

/* ── Room ── */
export interface RoomResponseDto {
  id: number
  name: string
  capacity: number
  price: number
  discountedPrice: number
  wishlisted: boolean
  wishlistCount: number
  averageRating: number
  reviewCount: number
  createdAt: string
}

export interface RoomCreateRequest {
  name: string
  capacity: number
  price: number
}

export type RoomUpdateRequest = RoomCreateRequest

/* ── Review ── */
export interface ReviewResponseDto {
  id: number
  memberId: number
  roomId: number
  rating: number
  content: string
  createdAt: string
}

export interface ReviewCreateRequest {
  roomId: number
  rating: number
  content?: string
}

export interface ReviewUpdateRequest {
  rating: number
  content?: string
}

/* ── Wishlist ── */
export interface WishlistResponseDto {
  id: number
  memberId: number
  roomId: number
  createdAt: string
}

export interface WishlistCreateRequest {
  roomId: number
}

/* ── Reservation ── */
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'PAYMENT_DONE' | 'REJECTED'
export type PaymentStatus = 'READY' | 'DONE' | 'CANCELED' | 'FAILED'

export interface ReservationResponse {
  id: number
  roomId: number
  orderId: string
  amount: number
  reservationDate: string
  startTime: string
  endTime: string
  status: ReservationStatus
  // ADMIN 목록 조회 시에만 채워짐 - 토스 결제 승인/환불 후 로컬 저장 실패로 인한 FAILED 이력
  paymentStatus?: PaymentStatus
  paymentFailureReason?: string
}

export interface ReservationInsertRequest {
  reservationDate: string
  startTime: string
  endTime: string
  amount: number
}

/* ── Payment ── */
export interface TossConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface TossPaymentResponse {
  paymentKey: string
  orderId: string
  orderName: string
  totalAmount: number
  status: string
  [key: string]: unknown
}
