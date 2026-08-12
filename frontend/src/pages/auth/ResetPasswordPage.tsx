import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { confirmPasswordReset } from '../../lib/api/auth'
import { ApiError } from '../../lib/api/client'

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

function StrengthBar({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  const cfg = [
    { label: '', color: '#e2e8f0' },
    { label: '취약', color: '#ef4444' },
    { label: '보통', color: '#f59e0b' },
    { label: '강함', color: '#22c55e' },
    { label: '매우 강함', color: '#16a34a' },
  ]
  if (!password) return null
  const c = cfg[score] ?? cfg[1]
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= score ? c.color : '#e2e8f0' }} />
        ))}
      </div>
      <span className="text-[11px] font-medium" style={{ color: c.color }}>{c.label}</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 토큰은 이메일 링크의 쿼리 파라미터에서만 읽어온다 - 사용자가 직접 입력하지 않음
  const token = searchParams.get('token') ?? ''
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showCf, setShowCf]         = useState(false)
  const [focusedPw, setFocusedPw]   = useState(false)
  const [focusedCf, setFocusedCf]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

  const mismatch  = confirm.length > 0 && password !== confirm
  const tooShort  = password.length > 0 && password.length < 8
  const canSubmit = password.length >= 8 && password === confirm && token.trim().length > 0

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f0f4ff' }}>
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', border: '1px solid #e8edf5' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">유효하지 않은 링크입니다</h2>
          <p className="text-sm text-gray-500 mb-6">비밀번호 재설정을 다시 요청해 주세요.</p>
          <button onClick={() => navigate('/find-password')}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
            재설정 다시 요청하기
          </button>
        </div>
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset({ token: token.trim(), newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '비밀번호 재설정에 실패했습니다. 토큰을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f0f4ff' }}>
      <div className="w-full max-w-[420px]">
        <button onClick={() => navigate('/login')} className="flex items-center gap-3 mb-8 justify-center hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">StudyRoom</span>
        </button>
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', border: '1px solid #e8edf5' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#f0fdf4' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>비밀번호가 변경되었습니다</h2>
          <p className="text-sm text-gray-500 mb-6">새 비밀번호로 로그인해 주세요.</p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.25)' }}>
            로그인하기
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f0f4ff' }}>
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <button onClick={() => navigate('/login')} className="flex items-center gap-3 mb-8 justify-center hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">StudyRoom</span>
        </button>

        <div className="rounded-2xl p-8" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', border: '1px solid #e8edf5' }}>
          <div className="mb-7">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#eff6ff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d5a9e" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ letterSpacing: '-0.03em' }}>새 비밀번호 설정</h2>
            <p className="text-sm text-gray-500">새로운 비밀번호를 입력해 주세요.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">새 비밀번호</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focusedPw ? '#2d5a9e' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showPw ? 'text' : 'password'} placeholder="8자 이상 입력" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedPw(true)} onBlur={() => setFocusedPw(false)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                  style={{ background: '#fff', border: `1.5px solid ${tooShort ? '#fca5a5' : focusedPw ? '#2d5a9e' : '#e2e8f0'}`, boxShadow: focusedPw ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {tooShort && <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>비밀번호는 8자 이상이어야 합니다.</p>}
              <StrengthBar password={password} />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호 확인</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focusedCf ? '#2d5a9e' : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showCf ? 'text' : 'password'} placeholder="비밀번호를 다시 입력" value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocusedCf(true)} onBlur={() => setFocusedCf(false)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                  style={{ background: '#fff', border: `1.5px solid ${mismatch ? '#fca5a5' : confirm && !mismatch ? '#86efac' : focusedCf ? '#2d5a9e' : '#e2e8f0'}`, boxShadow: focusedCf ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}
                />
                <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeIcon open={showCf} />
                </button>
              </div>
              {mismatch && <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>비밀번호가 일치하지 않습니다.</p>}
              {confirm && !mismatch && password.length >= 8 && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#16a34a' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  비밀번호가 일치합니다.
                </p>
              )}
            </div>

            <button type="submit" disabled={!canSubmit || loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all mt-1 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: canSubmit ? '0 4px 14px rgba(30,58,95,0.3)' : 'none' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  변경 중...
                </span>
              ) : '비밀번호 변경'}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-gray-700 transition-colors">로그인으로 돌아가기</button>
        </div>
      </div>
    </div>
  )
}
