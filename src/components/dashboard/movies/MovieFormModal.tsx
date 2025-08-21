import React, { useState, useEffect } from 'react'
import type { Movie, MovieTranslation, CreateMovie, UpdateMovie } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { validateMovieData, validateTranslationData, cleanMovieData, cleanTranslationData } from '@/lib/movies-utils'
import { useMoviesApi } from '@/hooks/use-movies-api'

interface MovieFormModalProps {
  isOpen: boolean
  onClose: () => void
  movie?: Movie | null
  onSuccess: () => void
}

export function MovieFormModal({ isOpen, onClose, movie, onSuccess }: MovieFormModalProps) {
  const { createMovie, updateMovie, loading } = useMoviesApi()
  const [activeTab, setActiveTab] = useState('movie')
  const [errors, setErrors] = useState<string[]>([])
  
  // Form state
  const [movieData, setMovieData] = useState<Partial<CreateMovie>>({
    imdb_id: '',
    originaltitle: '',
    type: '',
    url: '',
    primaryimage: '',
    trailer: '',
    releasedate: '',
    startyear: undefined,
    endyear: undefined,
    contentrating: '',
    isadult: false,
    runtimeminutes: undefined,
    averagerating: undefined,
    numvotes: undefined,
    metascore: undefined,
    budget: undefined,
    grossworldwide: undefined,
    countriesoforigin: [],
    spokenlanguages: [],
    filminglocations: [],
    productioncompanies: null,
    externallinks: []
  })

  const [translations, setTranslations] = useState<Partial<MovieTranslation>[]>([
    {
      language_code: 'tr',
      primarytitle: '',
      description: '',
      genres: [],
      interests: []
    }
  ])

  // Modal açıldığında form verilerini doldur
  useEffect(() => {
    if (movie && isOpen) {
      setMovieData({
        imdb_id: movie.imdb_id,
        originaltitle: movie.originaltitle,
        type: movie.type,
        url: movie.url,
        primaryimage: movie.primaryimage,
        trailer: movie.trailer,
        releasedate: movie.releasedate,
        startyear: movie.startyear,
        endyear: movie.endyear,
        contentrating: movie.contentrating,
        isadult: movie.isadult,
        runtimeminutes: movie.runtimeminutes,
        averagerating: movie.averagerating,
        numvotes: movie.numvotes,
        metascore: movie.metascore,
        budget: movie.budget,
        grossworldwide: movie.grossworldwide,
        countriesoforigin: movie.countriesoforigin,
        spokenlanguages: movie.spokenlanguages,
        filminglocations: movie.filminglocations,
        productioncompanies: movie.productioncompanies,
        externallinks: movie.externallinks
      })
    } else if (!movie && isOpen) {
      // Yeni film için formu sıfırla
      resetForm()
    }
  }, [movie, isOpen])

  const resetForm = () => {
    setMovieData({
      imdb_id: '',
      originaltitle: '',
      type: '',
      url: '',
      primaryimage: '',
      trailer: '',
      releasedate: '',
      startyear: undefined,
      endyear: undefined,
      contentrating: '',
      isadult: false,
      runtimeminutes: undefined,
      averagerating: undefined,
      numvotes: undefined,
      metascore: undefined,
      budget: undefined,
      grossworldwide: undefined,
      countriesoforigin: [],
      spokenlanguages: [],
      filminglocations: [],
      productioncompanies: null,
      externallinks: []
    })
    setTranslations([
      {
        language_code: 'tr',
        primarytitle: '',
        description: '',
        genres: [],
        interests: []
      }
    ])
    setErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validasyon
    const movieErrors = validateMovieData(movieData)
    const translationErrors: string[] = []
    
    translations.forEach((translation, index) => {
      const errors = validateTranslationData(translation)
      errors.forEach(error => {
        translationErrors.push(`Çeviri ${index + 1}: ${error}`)
      })
    })

    if (movieErrors.length > 0 || translationErrors.length > 0) {
      setErrors([...movieErrors, ...translationErrors])
      return
    }

    try {
      const cleanedMovieData = cleanMovieData(movieData) as CreateMovie
      const cleanedTranslations = translations.map(t => cleanTranslationData(t)) as Omit<MovieTranslation, 'id' | 'movie_id' | 'created_at'>[]

      if (movie) {
        // Güncelleme
        await updateMovie(movie.id, cleanedMovieData as UpdateMovie, cleanedTranslations)
      } else {
        // Yeni ekleme
        await createMovie(cleanedMovieData, cleanedTranslations)
      }

      onSuccess()
      onClose()
      resetForm()
    } catch (error) {
      console.error('Film kaydedilirken hata:', error)
      setErrors(['Film kaydedilirken hata oluştu'])
    }
  }

  const addTranslation = () => {
    setTranslations([
      ...translations,
      {
        language_code: '',
        primarytitle: '',
        description: '',
        genres: [],
        interests: []
      }
    ])
  }

  const removeTranslation = (index: number) => {
    if (translations.length > 1) {
      setTranslations(translations.filter((_, i) => i !== index))
    }
  }

  const updateTranslation = (index: number, field: keyof MovieTranslation, value: any) => {
    const newTranslations = [...translations]
    newTranslations[index] = { ...newTranslations[index], [field]: value }
    setTranslations(newTranslations)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {movie ? 'Film Düzenle' : 'Yeni Film Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="movie">Film Bilgileri</TabsTrigger>
              <TabsTrigger value="translations">Çeviriler</TabsTrigger>
            </TabsList>

            <TabsContent value="movie" className="space-y-4">
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imdb_id">IMDB ID *</Label>
                  <Input
                    id="imdb_id"
                    value={movieData.imdb_id || ''}
                    onChange={(e) => setMovieData({ ...movieData, imdb_id: e.target.value })}
                    placeholder="tt1234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originaltitle">Orijinal Başlık *</Label>
                  <Input
                    id="originaltitle"
                    value={movieData.originaltitle || ''}
                    onChange={(e) => setMovieData({ ...movieData, originaltitle: e.target.value })}
                    placeholder="Movie Title"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startyear">Başlangıç Yılı</Label>
                  <Input
                    id="startyear"
                    type="number"
                    value={movieData.startyear || ''}
                    onChange={(e) => setMovieData({ ...movieData, startyear: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="2024"
                    min="1888"
                    max="2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endyear">Bitiş Yılı</Label>
                  <Input
                    id="endyear"
                    type="number"
                    value={movieData.endyear || ''}
                    onChange={(e) => setMovieData({ ...movieData, endyear: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="2024"
                    min="1888"
                    max="2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="runtimeminutes">Süre (Dakika)</Label>
                  <Input
                    id="runtimeminutes"
                    type="number"
                    value={movieData.runtimeminutes || ''}
                    onChange={(e) => setMovieData({ ...movieData, runtimeminutes: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="120"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averagerating">Ortalama Puan</Label>
                  <Input
                    id="averagerating"
                    type="number"
                    step="0.1"
                    value={movieData.averagerating || ''}
                    onChange={(e) => setMovieData({ ...movieData, averagerating: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="8.5"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentrating">Yaş Sınırı</Label>
                  <Input
                    id="contentrating"
                    value={movieData.contentrating || ''}
                    onChange={(e) => setMovieData({ ...movieData, contentrating: e.target.value })}
                    placeholder="PG-13"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tür</Label>
                  <Input
                    id="type"
                    value={movieData.type || ''}
                    onChange={(e) => setMovieData({ ...movieData, type: e.target.value })}
                    placeholder="movie, tvSeries, etc."
                  />
                </div>
              </div>

              {/* URL'ler */}
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={movieData.url || ''}
                  onChange={(e) => setMovieData({ ...movieData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryimage">Poster URL</Label>
                  <Input
                    id="primaryimage"
                    type="url"
                    value={movieData.primaryimage || ''}
                    onChange={(e) => setMovieData({ ...movieData, primaryimage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailer">Fragman URL</Label>
                  <Input
                    id="trailer"
                    type="url"
                    value={movieData.trailer || ''}
                    onChange={(e) => setMovieData({ ...movieData, trailer: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Tarih */}
              <div className="space-y-2">
                <Label htmlFor="releasedate">Vizyon Tarihi</Label>
                <Input
                  id="releasedate"
                  type="date"
                  value={movieData.releasedate || ''}
                  onChange={(e) => setMovieData({ ...movieData, releasedate: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="translations" className="space-y-4">
              {translations.map((translation, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Çeviri {index + 1}</h4>
                    {translations.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTranslation(index)}
                      >
                        Kaldır
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`lang_${index}`}>Dil Kodu *</Label>
                      <Input
                        id={`lang_${index}`}
                        value={translation.language_code || ''}
                        onChange={(e) => updateTranslation(index, 'language_code', e.target.value)}
                        placeholder="tr, en, de"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`title_${index}`}>Çeviri Başlık *</Label>
                      <Input
                        id={`title_${index}`}
                        value={translation.primarytitle || ''}
                        onChange={(e) => updateTranslation(index, 'primarytitle', e.target.value)}
                        placeholder="Film Başlığı"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`desc_${index}`}>Açıklama</Label>
                    <Textarea
                      id={`desc_${index}`}
                      value={translation.description || ''}
                      onChange={(e) => updateTranslation(index, 'description', e.target.value)}
                      placeholder="Film açıklaması..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`genres_${index}`}>Türler (virgülle ayırın)</Label>
                      <Input
                        id={`genres_${index}`}
                        value={Array.isArray(translation.genres) ? translation.genres.join(', ') : ''}
                        onChange={(e) => updateTranslation(index, 'genres', e.target.value.split(',').map(g => g.trim()).filter(g => g))}
                        placeholder="Aksiyon, Drama, Komedi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`interests_${index}`}>İlgi Alanları (virgülle ayırın)</Label>
                      <Input
                        id={`interests_${index}`}
                        value={Array.isArray(translation.interests) ? translation.interests.join(', ') : ''}
                        onChange={(e) => updateTranslation(index, 'interests', e.target.value.split(',').map(i => i.trim()).filter(i => i))}
                        placeholder="Bilim Kurgu, Uzay, Zaman"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addTranslation}
                className="w-full"
              >
                + Çeviri Ekle
              </Button>
            </TabsContent>
          </Tabs>

          {/* Hatalar */}
          {errors.length > 0 && (
            <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
              <h4 className="font-medium text-destructive mb-2">Hatalar:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index} className="text-destructive">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (movie ? 'Güncelle' : 'Ekle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
