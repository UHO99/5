import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error'
interface Toast { id: string; type: ToastType; message: string }

interface ToastContextValue { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast overlay */}
      <div className="fixed bottom-20 right-4 md:bottom-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '340px' }}>
        {toasts.map((t) => (
          <div key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg pointer-events-auto"
            style={{
              background: t.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${t.type === 'success' ? '#86efac' : '#fca5a5'}`,
              animation: 'slideInUp 0.2s ease-out',
            }}>
            {t.type === 'success' ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#16a34a' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: '#dc2626' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium" style={{ color: t.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
