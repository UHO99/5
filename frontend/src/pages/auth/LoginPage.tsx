import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'

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

const LeftPanel = () => (
  <div
    className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 45%, #1a4480 100%)' }}
  >
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />
    <div className="absolute top-[-80px] right-[-80px] w-[360px] h-[360px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
    <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #93c5fd, transparent 70%)' }} />

    <div className="relative z-10 p-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">StudyRoom</span>
      </div>
    </div>

    <div className="relative z-10 px-12 pb-16">
      <h1 className="text-[2.6rem] font-bold leading-[1.2] mb-4" style={{ color: '#ffffff', letterSpacing: '-0.03em' }}>
        함께 공부하는<br />최적의 공간을<br />
        <span style={{ color: '#93c5fd' }}>지금 예약하세요</span>
      </h1>
      <p className="text-base leading-relaxed" style={{ color: '#93b4d6' }}>
        조용하고 쾌적한 스터디룸을 원하는 시간에<br />간편하게 예약하고 집중력을 높여보세요.
      </p>
      <div className="mt-8 flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>⚡</div>
        <div>
          <div className="text-sm font-semibold text-white">실시간 예약</div>
          <div className="text-xs mt-0.5" style={{ color: '#7aa8cc' }}>빈 방을 즉시 확인하고 예약</div>
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-6 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: '#93c5fd' }}>안내</span>
        </div>
        <div className="px-4 py-3 text-xs leading-relaxed" style={{ background: 'rgba(0,0,0,0.1)', color: '#93b4d6' }}>
          계정이 없다면 먼저 회원가입을 진행해주세요. 관리자 권한은 서버에 등록된 계정 기준으로 부여됩니다.
        </div>
      </div>
    </div>
  </div>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const ic = (f: string) => (focused === f ? '#2d5a9e' : '#9ca3af')

  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const role = await login(username, password)
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/rooms')
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f4ff' }}>
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">StudyRoom</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[1.9rem] font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.03em' }}>로그인</h2>
            <p className="text-sm text-gray-500">
              계정이 없으신가요?{' '}
              <button onClick={() => navigate('/signup')} className="font-semibold" style={{ color: '#2d5a9e' }}>회원가입</button>
            </p>
          </div>

          {error && (
            <div className="mb-2 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">아이디</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('username')} strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
                <input
                  type="text" placeholder="사용자 아이디" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
                  style={{ background: '#fff', border: `1.5px solid ${focused === 'username' ? '#2d5a9e' : '#e2e8f0'}`, boxShadow: focused === 'username' ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('password')} strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
                  style={{ background: '#fff', border: `1.5px solid ${focused === 'password' ? '#2d5a9e' : '#e2e8f0'}`, boxShadow: focused === 'password' ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 text-xs font-medium" style={{ color: '#2d5a9e' }}>
              <button type="button" onClick={() => navigate('/find-id')}>아이디 찾기</button>
              <span style={{ color: '#d1d5db' }}>|</span>
              <button type="button" onClick={() => navigate('/find-password')}>비밀번호 찾기</button>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-1"
              style={{ background: isLoading ? '#4a7ab5' : 'linear-gradient(135deg, #1e3a5f 0%, #2d5a9e 100%)', boxShadow: isLoading ? 'none' : '0 4px 14px rgba(30,58,95,0.35)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
