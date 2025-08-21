import type { Movie, MovieTranslation, CreateMovie } from '@/api/types'

// Film verilerini doğrula
export function validateMovieData(movieData: Partial<CreateMovie>): string[] {
  const errors: string[] = []

  if (!movieData.imdb_id || movieData.imdb_id.trim() === '') {
    errors.push('IMDB ID zorunludur')
  }

  if (!movieData.originaltitle || movieData.originaltitle.trim() === '') {
    errors.push('Orijinal başlık zorunludur')
  }

  if (movieData.startyear && (movieData.startyear < 1888 || movieData.startyear > new Date().getFullYear() + 1)) {
    errors.push('Başlangıç yılı geçerli olmalıdır (1888-2025)')
  }

  if (movieData.runtimeminutes && movieData.runtimeminutes < 1) {
    errors.push('Süre 1 dakikadan az olamaz')
  }

  if (movieData.averagerating && (movieData.averagerating < 0 || movieData.averagerating > 10)) {
    errors.push('Puan 0-10 arasında olmalıdır')
  }

  return errors
}

// Çeviri verilerini doğrula
export function validateTranslationData(translation: Partial<MovieTranslation>): string[] {
  const errors: string[] = []

  if (!translation.language_code || translation.language_code.trim() === '') {
    errors.push('Dil kodu zorunludur')
  }

  if (!translation.primarytitle || translation.primarytitle.trim() === '') {
    errors.push('Çeviri başlık zorunludur')
  }

  return errors
}

// Çoklu film verilerini doğrula
export function validateMultipleMoviesData(moviesData: Array<{
  movie: Partial<CreateMovie>
  translations: Partial<MovieTranslation>[]
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (moviesData.length === 0) {
    errors.push('En az bir film verisi gerekli')
    return { valid: false, errors }
  }

  moviesData.forEach((item, index) => {
    const movieErrors = validateMovieData(item.movie)
    if (movieErrors.length > 0) {
      errors.push(`Film ${index + 1}: ${movieErrors.join(', ')}`)
    }

    if (item.translations.length === 0) {
      errors.push(`Film ${index + 1}: En az bir çeviri gerekli`)
    } else {
      item.translations.forEach((translation, transIndex) => {
        const translationErrors = validateTranslationData(translation)
        if (translationErrors.length > 0) {
          errors.push(`Film ${index + 1}, Çeviri ${transIndex + 1}: ${translationErrors.join(', ')}`)
        }
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// Film verilerini temizle (boş alanları kaldır)
export function cleanMovieData(movieData: Partial<CreateMovie>): Partial<CreateMovie> {
  const cleaned: any = {}
  
  Object.entries(movieData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length === 0) {
        // Boş array'leri atla
        return
      }
      cleaned[key] = value
    }
  })

  return cleaned
}

// Çeviri verilerini temizle
export function cleanTranslationData(translation: Partial<MovieTranslation>): Partial<MovieTranslation> {
  const cleaned: any = {}
  
  Object.entries(translation).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length === 0) {
        // Boş array'leri atla
        return
      }
      cleaned[key] = value
    }
  })

  return cleaned
}

// Film verilerini formatla (görüntüleme için)
export function formatMovieData(movie: Movie): {
  id: number
  title: string
  year: string
  rating: string
  duration: string
  image: string | null
  imdbId: string
} {
  return {
    id: movie.id,
    title: movie.originaltitle || 'Başlık Yok',
    year: movie.startyear?.toString() || 'Yıl Yok',
    rating: movie.averagerating ? `${movie.averagerating.toFixed(1)}/10` : 'Puan Yok',
    duration: movie.runtimeminutes ? `${movie.runtimeminutes} dk` : 'Süre Yok',
    image: movie.primaryimage || null,
    imdbId: movie.imdb_id
  }
}

// Çoklu film verilerini parse et (JSON string'den)
export function parseMultipleMoviesData(jsonString: string): Array<{
  movie: Partial<CreateMovie>
  translations: Partial<MovieTranslation>[]
}> | null {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (!Array.isArray(parsed)) {
      throw new Error('Veri array formatında olmalı')
    }

    return parsed.map(item => ({
      movie: item.movie || {},
      translations: Array.isArray(item.translations) ? item.translations : []
    }))
  } catch (error) {
    console.error('JSON parse hatası:', error)
    return null
  }
}

// Film verilerini JSON formatında export et
export function exportMoviesToJson(movies: Movie[]): string {
  const exportData = movies.map(movie => ({
    id: movie.id,
    imdb_id: movie.imdb_id,
    originaltitle: movie.originaltitle,
    startyear: movie.startyear,
    endyear: movie.endyear,
    runtimeminutes: movie.runtimeminutes,
    averagerating: movie.averagerating,
    contentrating: movie.contentrating,
    primaryimage: movie.primaryimage,
    created_at: movie.created_at
  }))

  return JSON.stringify(exportData, null, 2)
}

// Film verilerini CSV formatında export et
export function exportMoviesToCsv(movies: Movie[]): string {
  const headers = ['ID', 'IMDB ID', 'Başlık', 'Yıl', 'Süre (dk)', 'Puan', 'Yaş Sınırı', 'Resim URL']
  
  const rows = movies.map(movie => [
    movie.id,
    movie.imdb_id,
    movie.originaltitle || '',
    movie.startyear || '',
    movie.runtimeminutes || '',
    movie.averagerating || '',
    movie.contentrating || '',
    movie.primaryimage || ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}
