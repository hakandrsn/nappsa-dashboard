import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Kullanıcı giriş yapmışsa dashboard'a, yapmamışsa login'e yönlendir
  return <Navigate to={user ? "/dashboard" : "/login"} />
}
