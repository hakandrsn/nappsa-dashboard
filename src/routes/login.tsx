import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { auth } from '@/api/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Mevcut kullanıcıyı kontrol et
    const checkUser = async () => {
      const { user } = await auth.getCurrentUser()
      if (user) {
        setUser(user)
      }
    }
    checkUser()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await auth.signIn(email, password)
      
      if (error) {
        toast({
          title: "Giriş hatası",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Başarılı",
          description: "Başarıyla giriş yapıldı",
        })
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Beklenmeyen bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Nappsa Dashboard</CardTitle>
          <CardDescription>
            Yönetim paneline erişmek için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
