import { useNavigate } from 'react-router'

export default function PaymentFailPage() {
  const navigate = useNavigate()

  // Toss가 붙이는 code/message는 해시(#) 앞의 진짜 쿼리스트링에 온다. 해시라우터의
  // useSearchParams()는 해시 안쪽 쿼리만 보기 때문에 window.location.search를 직접 읽는다.
  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get('code')
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#f4f7fb' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#fef2f2' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">결제에 실패했습니다</h2>
      <p className="text-sm text-gray-500 mb-1">{message}</p>
      {code && <p className="text-xs text-gray-400 mb-8">오류 코드: {code}</p>}
      {!code && <div className="mb-8" />}
      <div className="flex gap-3">
        <button onClick={() => navigate('/user/rooms')} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors" style={{ border: '1.5px solid #e2e8f0' }}>
          목록으로
        </button>
        <button onClick={() => navigate('/user/reservations')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
          예약 내역
        </button>
      </div>
    </div>
  )
}
