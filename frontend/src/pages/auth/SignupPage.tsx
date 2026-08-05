import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signup } from '../../lib/api/auth'
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

function Field({
  label, id, type = 'text', placeholder, value, onChange, focused, onFocus, onBlur, icon, right,
}: {
  label: string; id: string; type?: string; placeholder: string; value: string
  onChange: (v: string) => void; focused: boolean; onFocus: () => void; onBlur: () => void
  icon: React.ReactNode; right?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus} onBlur={onBlur}
          className="w-full py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200"
          style={{
            paddingLeft: '2.75rem', paddingRight: right ? '3rem' : '1rem',
            background: '#fff',
            border: `1.5px solid ${focused ? '#2d5a9e' : '#e2e8f0'}`,
            boxShadow: focused ? '0 0 0 3px rgba(45,90,158,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
          }}
        />
        {right && <div className="absolute right-4 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', email: '', name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const ic = (f: string) => (focused === f ? '#2d5a9e' : '#9ca3af')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await signup(form)
      navigate('/login')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '회원가입에 실패했습니다. 입력값을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f0f4ff' }}>
      <div className="w-full max-w-[420px]">
        <button onClick={() => navigate('/login')} className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-gray-900">StudyRoom</span>
        </button>

        <div className="mb-8">
          <h2 className="text-[1.9rem] font-bold text-gray-900 mb-2" style={{ letterSpacing: '-0.03em' }}>회원가입</h2>
          <p className="text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <button onClick={() => navigate('/login')} className="font-semibold" style={{ color: '#2d5a9e' }}>로그인</button>
          </p>
        </div>

        {error && (
          <div className="mb-2 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="아이디" id="username" placeholder="사용자 아이디"
            value={form.username} onChange={set('username')}
            focused={focused === 'username'} onFocus={() => setFocused('username')} onBlur={() => setFocused(null)}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('username')} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
          />

          <Field
            label="비밀번호" id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
            value={form.password} onChange={set('password')}
            focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('password')} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
            right={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <EyeIcon open={showPassword} />
              </button>
            }
          />

          <Field
            label="이메일" id="email" type="email" placeholder="hello@example.com"
            value={form.email} onChange={set('email')}
            focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('email')} strokeWidth="2" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" /></svg>}
          />

          <Field
            label="이름" id="name" placeholder="홍길동"
            value={form.name} onChange={set('name')}
            focused={focused === 'name'} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ic('name')} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
          />

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
                가입 중...
              </span>
            ) : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
