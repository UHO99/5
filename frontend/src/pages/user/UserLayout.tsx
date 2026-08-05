import { NavLink, Outlet, useNavigate, useLocation } from 'react-router'
import { useAuth, GRADE_CONFIG } from '../../context/AuthContext'

const NAV_ITEMS = [
  {
    to: '/user/rooms',
    label: '스터디룸',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
        <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" />
      </svg>
    ),
  },
  {
    to: '/user/wishlist',
    label: '위시리스트',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    to: '/user/reservations',
    label: '예약 내역',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/user/mypage',
    label: '마이페이지',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/user/rooms':        '스터디룸',
  '/user/wishlist':     '위시리스트',
  '/user/reservations': '예약 내역',
  '/user/mypage':       '마이페이지',
}

function getBreadcrumb(pathname: string) {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  if (pathname.includes('/reserve')) return '예약하기'
  if (pathname.includes('/payment')) return '결제'
  if (pathname.includes('/reviews')) return '리뷰'
  if (/\/user\/rooms\/\d+$/.test(pathname)) return '룸 상세'
  return '스터디룸'
}

export default function UserLayout() {
  const { username, grade, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const breadcrumb = getBreadcrumb(location.pathname)

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#f4f7fb' }}>

      {/* ── 데스크톱 사이드바 (md+) ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col" style={{ background: '#ffffff', borderRight: '1px solid #e8edf5' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <button onClick={() => navigate('/user/rooms')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">StudyRoomMate</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">메뉴</div>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/user/rooms'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                  isActive ? 'text-blue-900 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }>
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#1e3a5f' : undefined }}>{item.icon(isActive)}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">{username}</div>
              {grade && (
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: GRADE_CONFIG[grade].bg, color: GRADE_CONFIG[grade].color }}>
                  {GRADE_CONFIG[grade].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── 메인 컨텐츠 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 shrink-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #e8edf5' }}>
          {/* 모바일 로고 */}
          <button onClick={() => navigate('/user/rooms')} className="flex items-center gap-2 md:hidden hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5V19a1 1 0 001 1h6v-5h4v5h6a1 1 0 001-1V9.5M1 10l11-7 11 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">StudyRoomMate</span>
          </button>
          {/* 데스크톱 breadcrumb */}
          <div className="hidden md:block text-sm text-gray-400">
            <span className="text-gray-300">StudyRoomMate</span>
            <span className="mx-2 text-gray-200">/</span>
            <span className="text-gray-700 font-medium">{breadcrumb}</span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </header>

        {/* 컨텐츠 (모바일 하단 네비 패딩) */}
        <div className="flex-1 flex flex-col min-h-0 pb-16 md:pb-0">
          <Outlet />
        </div>
      </div>

      {/* ── 모바일 하단 네비 (~md) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex"
        style={{ background: '#fff', borderTop: '1px solid #e8edf5', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/user/rooms'}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors">
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#1e3a5f' : '#94a3b8' }}>{item.icon(isActive)}</span>
                <span className="text-[9px] font-semibold" style={{ color: isActive ? '#1e3a5f' : '#94a3b8' }}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
