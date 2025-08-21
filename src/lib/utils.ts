import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Tarih formatla
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  
  return new Intl.DateTimeFormat('tr-TR', defaultOptions).format(dateObj)
}

/**
 * Tarih formatla (kısa)
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Tarih formatla (sadece gün)
 */
export function formatDateDay(date: string | Date): string {
  return formatDate(date, {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Tarih formatla (sadece saat)
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Tarih formatla (göreceli)
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Az önce'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} gün önce`
  }
  
  return formatDateShort(dateObj)
}

/**
 * Sayı formatla
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('tr-TR').format(num)
}

/**
 * Para formatla
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency
  }).format(amount)
}

/**
 * Yüzde formatla
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Metin kısalt
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Slug oluştur
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Random ID oluştur
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Array'i chunk'lara böl
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Array'i karıştır
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Array'den duplicate'ları kaldır
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)]
}

/**
 * Object'i deep clone yap
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (typeof obj === 'object') {
    const clonedObj = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * Debounce fonksiyonu
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle fonksiyonu
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Local storage helper
 */
export const storage = {
  get: (key: string): any => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore errors
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear()
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Session storage helper
 */
export const sessionStorageHelper = {
  get: (key: string): any => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore errors
    }
  },
  
  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      // Ignore errors
    }
  },
  
  clear: (): void => {
    try {
      window.sessionStorage.clear()
    } catch {
      // Ignore errors
    }
  }
}
