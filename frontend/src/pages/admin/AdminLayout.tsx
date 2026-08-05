import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth, GRADE_CONFIG } from '../../context/AuthContext'

export default function AdminLayout() {
  const { isAdmin, username, grade, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    ...(isAdmin ? [{
      to: '/admin/dashboard',
      label: '대시보드',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    }] : []),
    {
      to: '/admin/rooms',
      label: '스터디룸',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" />
        </svg>
      ),
    },
    ...(isAdmin ? [{
      to: '/admin/reservations',
      label: '예약 관리',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    }] : []),
    ...(isAdmin ? [{
      to: '/admin/members',
      label: '회원 관리',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    }] : []),
    {
      to: '/admin/mypage',
      label: '마이페이지',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f4f7fb' }}>

      {/* ── 데스크톱 사이드바 ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ background: '#ffffff', borderRight: '1px solid #e8edf5' }}>
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <button onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/user/rooms')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-none">StudyRoom</div>
              {isAdmin && <div className="text-[10px] text-gray-400 mt-0.5 font-medium tracking-wide uppercase">Admin</div>}
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">메뉴</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/rooms'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                  isActive ? 'text-blue-800 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#1e3a5f' : undefined }}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{username}</div>
              {isAdmin
                ? <div className="text-xs text-gray-400">관리자</div>
                : grade && (
                  <span
                    className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: GRADE_CONFIG[grade].bg, color: GRADE_CONFIG[grade].color }}
                  >
                    {GRADE_CONFIG[grade].label}
                  </span>
                )
              }
            </div>
          </div>
        </div>
      </aside>

      {/* ── 메인 컨텐츠 ── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 shrink-0" style={{ background: '#ffffff', borderBottom: '1px solid #e8edf5' }}>
          {/* 모바일: 로고 */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">
              StudyRoom
              {isAdmin && <span className="ml-1 text-[10px] text-gray-400 font-medium uppercase">Admin</span>}
            </span>
          </div>
          {/* 데스크톱: breadcrumb */}
          <div className="hidden md:block text-sm text-gray-400">
            <span className="text-gray-300">StudyRoom</span>
            <span className="mx-2 text-gray-200">/</span>
            <span className="text-gray-700 font-medium">스터디룸</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </header>

        <Outlet />
      </div>

      {/* ── 모바일 하단 네비 ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden" style={{ background: '#ffffff', borderTop: '1px solid #e8edf5', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin/rooms'}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#1e3a5f' : '#9ca3af' }}>{item.icon}</span>
                <span className="text-[10px] font-medium" style={{ color: isActive ? '#1e3a5f' : '#9ca3af' }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span className="text-[10px] font-medium">로그아웃</span>
        </button>
      </nav>

    </div>
  )
}
