import { apiFetch } from './client'
import type { TossConfirmRequest, TossPaymentResponse } from './types'

export function confirmPayment(body: TossConfirmRequest): Promise<TossPaymentResponse> {
  return apiFetch<TossPaymentResponse>('/api/payment/confirm', { method: 'POST', body })
}
