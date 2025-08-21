import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  // Kullanıcı girişi
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Kullanıcı çıkışı
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Mevcut kullanıcıyı al
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Oturum durumunu dinle
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // Genel CRUD operasyonları
  create: async <T>(table: string, data: any): Promise<{ data: T | null; error: any }> => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    return { data: result, error }
  },

  read: async <T>(table: string, id: number | string): Promise<{ data: T | null; error: any }> => {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  readAll: async <T>(table: string, options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<{ data: T[] | null; error: any }> => {
    let query = supabase.from(table).select(options?.select || '*')

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
    }

    const { data, error } = await query
    return { data: data as T[] | null, error }
  },

  update: async <T>(table: string, id: number | string, data: any): Promise<{ data: T | null; error: any }> => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    return { data: result, error }
  },

  delete: async (table: string, id: number | string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    return { error }
  },

  // Pagination ile veri alma
  readPaginated: async <T>(table: string, page: number, limit: number, options?: {
    select?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
  }): Promise<{ data: T[] | null; count: number | null; error: any }> => {
    const offset = (page - 1) * limit

    // Toplam sayıyı al
    let countQuery = supabase.from(table).select('*', { count: 'exact', head: true })
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        countQuery = countQuery.eq(key, value)
      })
    }
    const { count, error: countError } = await countQuery

    if (countError) {
      return { data: null, count: null, error: countError }
    }

    // Verileri al
    const { data, error } = await db.readAll<T>(table, {
      select: options?.select,
      filters: options?.filters,
      orderBy: options?.orderBy,
      limit,
      offset
    })

    return { data, count, error }
  }
}

// Storage helper functions
export const storage = {
  // Dosya yükleme
  upload: async (bucket: string, path: string, file: File): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: false,
        cacheControl: '3600'
      })
    return { data, error }
  },

  // Dosya silme
  remove: async (bucket: string, path: string): Promise<{ error: any }> => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    return { error }
  },

  // Public URL alma
  getPublicUrl: (bucket: string, path: string): { data: { publicUrl: string } } => {
    return supabase.storage
      .from(bucket)
      .getPublicUrl(path)
  }
}

// Real-time subscriptions
export const realtime = {
  // Tablo değişikliklerini dinle
  subscribe: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe()
  },

  // Belirli bir satır değişikliklerini dinle
  subscribeToRow: (table: string, id: number | string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}:id=eq.${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `id=eq.${id}` }, callback)
      .subscribe()
  }
}

export default supabase
