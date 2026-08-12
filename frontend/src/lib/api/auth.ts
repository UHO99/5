import { apiFetch, decodeJwtMemberId, tokenStore } from './client'
import type {
  FindUsernameRequest,
  LoginRequest,
  LoginResponse,
  MemberResponse,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  SignupRequest,
} from './types'

export async function login(req: LoginRequest): Promise<{ tokens: LoginResponse; memberId: number | null }> {
  const tokens = await apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body: req, skipAuth: true })
  tokenStore.setTokens(tokens.accessToken, tokens.refreshToken)
  return { tokens, memberId: decodeJwtMemberId(tokens.accessToken) }
}

export function signup(req: SignupRequest): Promise<MemberResponse> {
  return apiFetch<MemberResponse>('/api/members', { method: 'POST', body: req, skipAuth: true })
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/api/auth/logout', { method: 'POST' })
  } finally {
    tokenStore.clear()
  }
}

export function findUsername(req: FindUsernameRequest): Promise<string> {
  return apiFetch<string>('/api/auth/find-username', { method: 'POST', body: req, skipAuth: true })
}

export function requestPasswordReset(req: PasswordResetRequest): Promise<void> {
  return apiFetch<void>('/api/auth/password-reset/request', { method: 'POST', body: req, skipAuth: true })
}

export function confirmPasswordReset(req: PasswordResetConfirmRequest): Promise<void> {
  return apiFetch<void>('/api/auth/password-reset/confirm', { method: 'POST', body: req, skipAuth: true })
}
