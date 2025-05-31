import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail } from '../../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const STATIC_EMAIL = 'admin@napsa.com'; // Buraya sabit e-posta adresinizi yazın

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithEmail(STATIC_EMAIL, password);
      if (error) throw error;
      
      navigate('/');
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError('Giriş başarısız. Lütfen şifrenizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Nappsa Dashboard</CardTitle>
          <CardDescription className="text-center">
            Yönetim paneline erişmek için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                E-posta
              </label>
              <Input
                id="email"
                type="email"
                value={STATIC_EMAIL}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Şifre
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Şifremi Unuttum?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-sm">
          <p className="text-muted-foreground text-center">
            {new Date().getFullYear()} Nappsa Tüm hakları saklıdır.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
