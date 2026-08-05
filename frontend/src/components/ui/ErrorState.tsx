interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = '오류가 발생했습니다.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#fef2f2', border: '1.5px dashed #fca5a5' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: '#b91c1c' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-3 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          다시 시도
        </button>
      )}
    </div>
  )
}
