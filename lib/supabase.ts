import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase istemcisini oluştur
const supabase = createClient(supabaseUrl, supabaseKey!);

// E-posta ve şifre ile giriş yapma fonksiyonu
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error('Giriş yapılırken hata oluştu:', error);
    return { data: null, error };
  }
}

// Çıkış yapma fonksiyonu
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Mevcut kullanıcıyı alma fonksiyonu
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

// Oturum değişikliklerini dinleme fonksiyonu
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

export { supabase }