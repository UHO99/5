type Size = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<Size, number> = { sm: 20, md: 32, lg: 48 }

export function LoadingSpinner({ size = 'md', label = '로딩 중...' }: { size?: Size; label?: string }) {
  const s = SIZE_MAP[size]
  return (
    <div role="status" aria-label={label} className="flex flex-col items-center justify-center gap-3">
      <svg width={s} height={s} viewBox="0 0 32 32" className="animate-spin">
        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(30,58,95,0.12)" strokeWidth="3" />
        <path d="M16 4a12 12 0 0112 12" fill="none" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
