import { useState } from 'react'
import { useNavigate } from 'react-router'
import { findUsername } from '../../lib/api/auth'

export default function FindIdPage() {
  const navigate = useNavigate()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const username = await findUsername({ name: name.trim(), email: email.trim() })
      setResult(username || null)
    } catch {
      setResult(null)
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  const ic = (f: string) => focusedField === f ? '#2d5a9e' : '#9ca3af'
  const border = (f: string) => `1.5px solid ${focusedField === f ? '#2d5a9e' : '#e2e8f0'}`
  const shadow = (f: string) => focusedField === f ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)'

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

          {!submitted ? (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ letterSpacing: '-0.03em' }}>아이디 찾기</h2>
                <p className="text-sm text-gray-500">가입 시 등록한 이름과 이메일을 입력하세요.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('name')} strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                    <input
                      type="text" placeholder="실명을 입력하세요" value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                      style={{ background: '#fff', border: border('name'), boxShadow: shadow('name') }}
                    />
                  </div>
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('email')} strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      type="email" placeholder="example@email.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                      style={{ background: '#fff', border: border('email'), boxShadow: shadow('email') }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !name.trim() || !email.trim()}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all mt-1 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)', boxShadow: '0 4px 14px rgba(30,58,95,0.3)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      확인 중...
                    </span>
                  ) : '아이디 찾기'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1.5" style={{ letterSpacing: '-0.03em' }}>아이디 찾기 결과</h2>
              </div>

              {result ? (
                <div className="rounded-xl px-6 py-5 mb-6 text-center" style={{ background: '#f0f9ff', border: '1.5px solid #bfdbfe' }}>
                  <p className="text-sm text-gray-500 mb-3">회원님의 아이디</p>
                  <p className="text-2xl font-bold tracking-widest" style={{ color: '#1e3a5f', letterSpacing: '0.08em' }}>{result}</p>
                </div>
              ) : (
                <div className="rounded-xl px-6 py-5 mb-6 text-center flex flex-col items-center gap-2" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: '#b91c1c' }}>입력하신 정보와 일치하는 아이디가 없습니다.</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button onClick={() => { setSubmitted(false); setName(''); setEmail(''); setResult(null) }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                  style={{ border: '1.5px solid #e2e8f0' }}>
                  다시 찾기
                </button>
                <button onClick={() => navigate('/login')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
                  로그인하기
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom links */}
        <div className="flex items-center justify-center gap-4 mt-6 text-sm">
          <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-gray-700 transition-colors">로그인</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/signup')} className="text-gray-400 hover:text-gray-700 transition-colors">회원가입</button>
          <span className="text-gray-200">|</span>
          <button className="font-semibold" style={{ color: '#2d5a9e', cursor: 'default' }}>아이디 찾기</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/find-password')} className="text-gray-400 hover:text-gray-700 transition-colors">비밀번호 찾기</button>
        </div>
      </div>
    </div>
  )
}
