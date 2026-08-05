import { useState } from 'react'
import { useNavigate } from 'react-router'
import { requestPasswordReset } from '../../lib/api/auth'
import { ApiError } from '../../lib/api/client'

type Step = 'input' | 'sent'

export default function FindPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep]         = useState<Step>('input')
  const [email, setEmail]       = useState('')
  const [focused, setFocused]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset({ email: email.trim() })
      setStep('sent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '해당 이메일로 가입된 계정을 찾을 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 같은 이메일로 재설정 메일을 다시 보낸다 (링크는 이메일에서만 열리므로, 재설정 페이지로 직접 이동하는 버튼은 두지 않는다)
  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset({ email: email.trim() })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '재전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const ic = focused ? '#2d5a9e' : '#9ca3af'

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

          {step === 'input' ? (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ letterSpacing: '-0.03em' }}>비밀번호 찾기</h2>
                <p className="text-sm text-gray-500">가입 시 등록한 이메일로 비밀번호 재설정 링크를 보내드립니다.</p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic} strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email" placeholder="example@email.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); setError('') }}
                      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                      style={{ background: '#fff', border: `1.5px solid ${error ? '#fca5a5' : focused ? '#2d5a9e' : '#e2e8f0'}`, boxShadow: focused ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email.trim()}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all mt-1 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      전송 중...
                    </span>
                  ) : '재설정 링크 전송'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2d5a9e" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1" style={{ letterSpacing: '-0.02em' }}>이메일을 확인하세요</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-700">{email}</span>으로<br />
                  비밀번호 재설정 링크를 발송했습니다.
                </p>
              </div>

              <div className="rounded-xl px-4 py-3.5 mb-6 text-xs text-gray-500 leading-relaxed" style={{ background: '#f8fafc', border: '1px solid #e8edf5' }}>
                이메일이 도착하지 않았다면 스팸함을 확인하거나 잠시 후 다시 시도해 주세요. 링크는 <b>30분</b>간 유효합니다.
              </div>

              {error && (
                <div className="mb-3 px-4 py-2.5 rounded-xl text-xs font-medium text-center" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              <button onClick={handleResend} disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 mb-3 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.25)' }}>
                {loading ? '재전송 중...' : '재시도'}
              </button>

              <button onClick={() => { setStep('input'); setEmail(''); setError('') }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
                style={{ border: '1.5px solid #e2e8f0' }}>
                다른 이메일로 다시 시도
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-gray-700 transition-colors">로그인</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/signup')} className="text-gray-400 hover:text-gray-700 transition-colors">회원가입</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/find-id')} className="text-gray-400 hover:text-gray-700 transition-colors">아이디 찾기</button>
          <span className="text-gray-200">|</span>
          <button className="font-semibold" style={{ color: '#2d5a9e', cursor: 'default' }}>비밀번호 찾기</button>
        </div>
      </div>
    </div>
  )
}
