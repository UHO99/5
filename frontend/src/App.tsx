import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

function AppRouter() {
  const { initializing } = useAuth()
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" label="세션 확인 중..." />
      </div>
    )
  }
  return <RouterProvider router={router} />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  )
}
