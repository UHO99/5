import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loadTossPayments, type TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

interface PaymentState {
  roomId: number
  roomName: string
  date: string
  startHour: number
  endHour: number
  selectedHours: number[]
  price: number
  basePrice: number
  discount: number
  orderId: string
  reservationId: number
  customerName: string
  customerEmail: string
}

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined

export default function PaymentPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { memberId, username } = useAuth()
  const { showToast } = useToast()

  const state = location.state as PaymentState | undefined
  const [allAgree, setAllAgree] = useState(false)

  const widgetsRef = useRef<TossPaymentsWidgets | null>(null)
  const [widgetReady, setWidgetReady] = useState(false)
  const [widgetError, setWidgetError] = useState('')
  const [requesting, setRequesting]   = useState(false)

  useEffect(() => {
    if (!state || typeof state.price !== 'number') return
    if (!TOSS_CLIENT_KEY) {
      setWidgetError('결제 위젯 설정(VITE_TOSS_CLIENT_KEY)이 누락되었습니다.')
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
        const customerKey = `cust-${memberId ?? username}`
        const widgets = tossPayments.widgets({ customerKey })
        if (cancelled) return
        widgetsRef.current = widgets

        await widgets.setAmount({ currency: 'KRW', value: state.price })
        const [, agreementWidget] = await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-method' }),
          widgets.renderAgreement({ selector: '#toss-agreement' }),
        ])
        if (cancelled) return

        agreementWidget.on('agreementStatusChange', (status) => {
          setAllAgree(status.agreedRequiredTerms)
        })

        setWidgetReady(true)
      } catch (err) {
        console.error('Toss 결제 위젯 로드 실패:', err)
        if (!cancelled) setWidgetError('결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.orderId])

  if (!state || typeof state.price !== 'number' || typeof state.basePrice !== 'number' || !state.orderId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-400">결제 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/user/rooms')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a9e)' }}>
          목록으로
        </button>
      </div>
    )
  }

  const { roomName, date, selectedHours, price, basePrice, discount, orderId } = state
  const slotLabel = (h: number) => `${h}:00~${h + 1}:00`
  const canPay = allAgree && widgetReady && !requesting

  const handlePay = async () => {
    const widgets = widgetsRef.current
    if (!widgets) return
    setRequesting(true)
    try {
      // 이전 결제의 orderId/paymentKey/amount가 주소창 쿼리스트링에 남아있을 수 있으므로
      // window.location.href 전체가 아니라 쿼리 없는 origin+pathname을 기준으로 만든다.
      const baseUrl = `${window.location.origin}${window.location.pathname}`
      const successUrl = new URL('#/user/payment/success', baseUrl).toString()
      const failUrl = new URL('#/user/payment/fail', baseUrl).toString()
      await widgets.requestPayment({
        orderId,
        orderName: `${roomName} 예약`,
        successUrl,
        failUrl,
        customerName: state.customerName || undefined,
        customerEmail: state.customerEmail || undefined,
      })
    } catch {
      showToast('결제 요청에 실패했습니다. 다시 시도해주세요.', 'error')
      setRequesting(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          이전으로
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ letterSpacing: '-0.02em' }}>결제</h1>

        {/* 주문 정보 */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-700 mb-4">상품 정보</h2>
          <div className="flex flex-col gap-0">
            {[
              { label: '스터디룸', value: roomName },
              { label: '날짜', value: date },
              { label: '시간', value: selectedHours.map(slotLabel).join(', ') },
              { label: '총 시간', value: `${selectedHours.length}시간` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm text-gray-500">기본 요금</span>
              <span className="text-sm text-gray-900">{basePrice.toLocaleString()}원</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span className="text-sm text-gray-500">등급 할인 ({Math.round(discount * 100)}%)</span>
                <span className="text-sm" style={{ color: '#16a34a' }}>-{(basePrice - price).toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <span className="font-bold text-gray-900">결제 금액</span>
              <span className="text-xl font-bold" style={{ color: '#1e3a5f' }}>{price.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* Toss 결제위젯 */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-bold text-gray-700 mb-3">결제 방법</h2>
          {widgetError ? (
            <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {widgetError}
            </div>
          ) : (
            <>
              {!widgetReady && <p className="text-xs text-gray-400 mb-3">결제 위젯을 불러오는 중...</p>}
              <div id="toss-payment-method" />
              <div id="toss-agreement" className="mt-3" />
            </>
          )}
        </div>

        {/* 결제하기 버튼 */}
        <button disabled={!canPay} onClick={handlePay}
          className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-40"
          style={{ background: canPay ? '#0064FF' : '#94a3b8', boxShadow: canPay ? '0 8px 20px rgba(0,100,255,0.3)' : 'none' }}>
          {requesting ? '결제 요청 중...' : `${price.toLocaleString()}원 결제하기`}
        </button>
        {!allAgree && widgetReady && (
          <p className="text-center text-xs text-gray-400 mt-2">필수 약관에 동의해주세요</p>
        )}
      </div>
    </div>
  )
}
