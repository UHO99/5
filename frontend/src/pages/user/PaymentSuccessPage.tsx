import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import * as paymentApi from '../../lib/api/payment'
import { ApiError } from '../../lib/api/client'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()

  const [status, setStatus] = useState<'confirming' | 'done' | 'error'>('confirming')
  const [errorMessage, setErrorMessage] = useState('')
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    // Toss가 붙이는 orderId/paymentKey/amount는 해시(#) 앞의 진짜 쿼리스트링에 온다.
    // 해시라우터에서는 react-router의 useSearchParams()가 해시 안쪽 쿼리만 보기 때문에
    // 여기선 window.location.search를 직접 읽어야 한다.
    const searchParams = new URLSearchParams(window.location.search)
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId')
    const amountParam = searchParams.get('amount')

    if (!paymentKey || !orderId || !amountParam) {
      setStatus('error')
      setErrorMessage('결제 정보가 올바르지 않습니다.')
      return
    }

    const amountValue = Number(amountParam)
    setAmount(amountValue)

    paymentApi
      .confirmPayment({ paymentKey, orderId, amount: amountValue })
      .then(() => setStatus('done'))
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err instanceof ApiError ? err.message : '결제 승인에 실패했습니다.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" label="결제를 확인하는 중..." />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#f4f7fb' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#fef2f2' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">결제 승인에 실패했습니다</h2>
        <p className="text-sm text-gray-500 mb-8">{errorMessage}</p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#f4f7fb' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">예약이 완료되었습니다!</h2>
      <div className="text-xl font-bold mb-8" style={{ color: '#1e3a5f' }}>{amount.toLocaleString()}원 결제 완료</div>
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
