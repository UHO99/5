import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../lib/api/auth'
import * as membersApi from '../lib/api/members'
import { decodeJwtMemberId, tokenStore } from '../lib/api/client'
import type { Grade as ServerGrade, MemberResponse } from '../lib/api/types'

type Role = 'user' | 'admin' | null

export type Grade = 'bronze' | 'silver' | 'gold' | 'vip'

export const GRADE_CONFIG: Record<Grade, { label: string; discount: number; color: string; bg: string }> = {
  bronze: { label: '브론즈', discount: 0,    color: '#92400e', bg: '#fef3c7' },
  silver: { label: '실버',   discount: 0.05, color: '#475569', bg: '#f1f5f9' },
  gold:   { label: '골드',   discount: 0.10, color: '#b45309', bg: '#fffbeb' },
  vip:    { label: 'VIP',    discount: 0.15, color: '#1e40af', bg: '#eff6ff' },
}

function mapServerGrade(grade: ServerGrade | null | undefined): Grade | null {
  switch (grade) {
    case 'BRONZE': return 'bronze'
    case 'SILVER': return 'silver'
    case 'GOLD': return 'gold'
    case 'VIP': return 'vip'
    default: return null
  }
}

interface AuthContextValue {
  role: Role
  memberId: number | null
  username: string
  name: string
  email: string
  grade: Grade | null
  isAdmin: boolean
  initializing: boolean
  login: (username: string, password: string) => Promise<'user' | 'admin'>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (name: string, email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState<number | null>(null)
  const [role, setRole]         = useState<Role>(null)
  const [username, setUsername] = useState('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [grade, setGrade]       = useState<Grade | null>(null)
  const [initializing, setInitializing] = useState(true)

  const applyProfile = (id: number, profile: MemberResponse) => {
    setMemberId(id)
    setUsername(profile.username)
    setName(profile.name)
    setEmail(profile.email)
    setRole(profile.role === 'ADMIN' ? 'admin' : 'user')
    setGrade(mapServerGrade(profile.grade))
  }

  const clearState = () => {
    setMemberId(null)
    setRole(null)
    setUsername('')
    setName('')
    setEmail('')
    setGrade(null)
  }

  useEffect(() => {
    const token = tokenStore.getAccessToken()
    if (!token) {
      setInitializing(false)
      return
    }
    const id = decodeJwtMemberId(token)
    if (id === null) {
      tokenStore.clear()
      setInitializing(false)
      return
    }
    membersApi
      .getMyPage(id)
      .then((profile) => applyProfile(id, profile))
      .catch(() => tokenStore.clear())
      .finally(() => setInitializing(false))
  }, [])

  const login = async (u: string, password: string): Promise<'user' | 'admin'> => {
    const { memberId: id } = await authApi.login({ username: u, password })
    if (id === null) throw new Error('로그인 응답에서 사용자 정보를 확인할 수 없습니다.')
    const profile = await membersApi.getMyPage(id)
    applyProfile(id, profile)
    return profile.role === 'ADMIN' ? 'admin' : 'user'
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearState()
    }
  }

  const refreshProfile = async () => {
    if (memberId === null) return
    const profile = await membersApi.getMyPage(memberId)
    applyProfile(memberId, profile)
  }

  const updateProfile = async (n: string, e: string) => {
    if (memberId === null) return
    const profile = await membersApi.updateInfo(memberId, { name: n, email: e })
    applyProfile(memberId, profile)
  }

  return (
    <AuthContext.Provider
      value={{
        role,
        memberId,
        username,
        name,
        email,
        grade,
        isAdmin: role === 'admin',
        initializing,
        login,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
