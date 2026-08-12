import type { LoginResponse, ResultDto } from './types'

const ACCESS_TOKEN_KEY = 'srm_access_token'
const REFRESH_TOKEN_KEY = 'srm_refresh_token'

let currentTokenIssuedAt = Date.now()

export const tokenStore = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    currentTokenIssuedAt = Date.now()
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// API 요청이 마지막으로 성공한 시각. 실제로 서버와 통신해야 "활동"으로 인정한다.
let lastActivityAt = Date.now()

const CHECK_INTERVAL_MS = 30_000
const REFRESH_LEAD_TIME_MS = 60_000

// 30초마다 액세스 토큰이 곧 만료되는지 확인하고, 그 사이 실제 API 호출이 있었을 때만 조용히 재발급한다.
setInterval(async () => {
  const accessToken = tokenStore.getAccessToken()
  if (!accessToken) return

  const expiresAt = decodeJwtExpirationMs(accessToken)
  if (expiresAt === null || expiresAt - Date.now() > REFRESH_LEAD_TIME_MS) return
  if (lastActivityAt < currentTokenIssuedAt) return // 방치 상태 - 갱신하지 않고 자연 만료에 맡긴다

  await tryReissue()
}, CHECK_INTERVAL_MS)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class AuthExpiredError extends Error {
  constructor() {
    super('로그인이 만료되었습니다. 다시 로그인해주세요.')
    this.name = 'AuthExpiredError'
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type QueryValue = string | number | boolean | undefined | null

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: Record<string, QueryValue>
  skipAuth?: boolean
  skipRetry?: boolean
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(BASE_URL + path, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function rawRequest(path: string, options: ApiFetchOptions): Promise<{ status: number; body: unknown }> {
  const { body, query, skipAuth, headers, ...rest } = options
  const finalHeaders: Record<string, string> = { Accept: 'application/json', ...(headers as Record<string, string> | undefined) }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'
  if (!skipAuth) {
    const token = tokenStore.getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }
  return { status: res.status, body: parsed }
}

let reissuePromise: Promise<boolean> | null = null

async function tryReissue(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return false

  if (!reissuePromise) {
    reissuePromise = (async () => {
      try {
        const { status, body } = await rawRequest('/api/auth/reissue', {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
        })
        const result = body as ResultDto<LoginResponse> | null
        if (status >= 200 && status < 300 && result?.data?.accessToken) {
          tokenStore.setTokens(result.data.accessToken, result.data.refreshToken)
          return true
        }
        return false
      } catch {
        return false
      } finally {
        reissuePromise = null
      }
    })()
  }
  return reissuePromise
}

/** ResultDto<T> 봉투를 벗겨 data만 반환. 봉투가 없는 응답(TossPaymentResponse 등)은 그대로 반환. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { status, body } = await rawRequest(path, options)

  if (status >= 200 && status < 300) {
    lastActivityAt = Date.now()
    if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
      return (body as Record<string, unknown>).data as T
    }
    return body as T
  }

  if (status === 401 && !options.skipAuth && !options.skipRetry) {
    const reissued = await tryReissue()
    if (reissued) {
      return apiFetch<T>(path, { ...options, skipRetry: true })
    }
    tokenStore.clear()
    throw new AuthExpiredError()
  }

  const message =
    (body && typeof body === 'object' && 'message' in (body as Record<string, unknown>)
      ? String((body as Record<string, unknown>).message)
      : null) || `요청에 실패했습니다. (${status})`
  throw new ApiError(status, message)
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** JWT accessToken payload에서 회원 id로 추정되는 클레임을 순서대로 탐색. */
export function decodeJwtMemberId(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  for (const key of ['id', 'memberId', 'sub']) {
    const value = payload[key]
    if (value === undefined || value === null) continue
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return null
}

/** JWT payload의 만료 시각(exp, 초 단위) → 밀리초 타임스탬프. */
function decodeJwtExpirationMs(token: string): number | null {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  if (typeof exp !== 'number') return null
  return exp * 1000
}
