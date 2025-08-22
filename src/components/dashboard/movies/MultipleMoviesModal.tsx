import { useState } from 'react'
import type { CreateMovie, MovieTranslation } from '@/api/types'
import { Button } from '@/components/ui/button'

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
import { validateMultipleMoviesData, parseMultipleMoviesData } from '@/lib/movies-utils'
import { useMoviesApi } from '@/hooks/use-movies-api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle, CheckCircle } from 'lucide-react'

interface MultipleMoviesModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MultipleMoviesModal({ isOpen, onClose, onSuccess }: MultipleMoviesModalProps) {
  const { createMultipleMovies, loading } = useMoviesApi()
  const [activeTab, setActiveTab] = useState('json')
  const [jsonInput, setJsonInput] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<Array<{
    movie: Partial<CreateMovie>
    translations: Partial<MovieTranslation>[]
  }> | null>([])

  // JSON formatı örneği
  const jsonExample = `[
  {
    "movie": {
      "imdb_id": "tt1234567",
      "originaltitle": "Example Movie 1",
      "startyear": 2024,
      "runtimeminutes": 120,
      "averagerating": 8.5
    },
    "translations": [
      {
        "language_code": "tr",
        "primarytitle": "Örnek Film 1",
        "description": "Bu bir örnek film açıklamasıdır",
        "genres": ["Aksiyon", "Drama"],
        "interests": ["Macera", "Gerilim"]
      }
    ]
  },
  {
    "movie": {
      "imdb_id": "tt7654321",
      "originaltitle": "Example Movie 2",
      "startyear": 2023,
      "runtimeminutes": 95,
      "averagerating": 7.8
    },
    "translations": [
      {
        "language_code": "tr",
        "primarytitle": "Örnek Film 2",
        "description": "İkinci örnek film",
        "genres": ["Komedi", "Romantik"],
        "interests": ["Aşk", "Mizah"]
      }
    ]
  }
]`

  // JSON'ı parse et ve önizle
  const parseAndPreview = () => {
    setErrors([])
    setSuccess([])
    
    if (!jsonInput.trim()) {
      setErrors(['Lütfen JSON verisi girin'])
      return
    }

    try {
      const parsed = parseMultipleMoviesData(jsonInput)
      if (!parsed) {
        setErrors(['JSON formatı geçersiz'])
        return
      }

      // Validasyon
      const validation = validateMultipleMoviesData(parsed)
      if (!validation.valid) {
        setErrors(validation.errors)
        return
      }

      setPreviewData(parsed)
      setSuccess([`${parsed.length} film başarıyla parse edildi`])
    } catch (error) {
      setErrors(['JSON parse hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')])
    }
  }

  // Filmleri kaydet
  const handleSubmit = async () => {
    if (!previewData || previewData.length === 0) {
      setErrors(['Önce JSON verisini parse edin'])
      return
    }

    try {
      setErrors([])
      setSuccess([])
      
      await createMultipleMovies(previewData as Array<{
        movie: CreateMovie
        translations: Omit<MovieTranslation, 'id' | 'movie_id' | 'created_at'>[]
      }>)

      setSuccess([`${previewData.length} film başarıyla eklendi`])
      
      // Formu temizle
      setTimeout(() => {
        setJsonInput('')
        setPreviewData([])
        setErrors([])
        setSuccess([])
        onSuccess()
        onClose()
      }, 2000)
    } catch (error) {
      setErrors(['Filmler eklenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')])
    }
  }

  // Formu temizle
  const resetForm = () => {
    setJsonInput('')
    setPreviewData([])
    setErrors([])
    setSuccess([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Çoklu Film Ekle</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="json">JSON Girişi</TabsTrigger>
              <TabsTrigger value="preview">Önizleme</TabsTrigger>
              <TabsTrigger value="help">Yardım</TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-input">JSON Verisi</Label>
                <Textarea
                  id="json-input"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="JSON formatında film verilerini buraya yapıştırın..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={parseAndPreview} disabled={loading}>
                  Parse Et ve Önizle
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setJsonInput(jsonExample)}
                >
                  Örnek Yükle
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setJsonInput('')}
                >
                  Temizle
                </Button>
              </div>

              {/* Hatalar */}
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Başarı mesajları */}
              {success.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {success.map((msg, index) => (
                        <li key={index}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {!previewData || previewData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Önce JSON verisini parse edin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Önizleme: {previewData?.length || 0} Film</h4>
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Ekleniyor...' : `${previewData?.length || 0} Filmi Ekle`}
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {previewData?.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Film {index + 1}</h5>
                          <div className="text-sm text-muted-foreground">
                            {item.translations.length} çeviri
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">IMDB ID:</span> {item.movie.imdb_id}
                          </div>
                          <div>
                            <span className="font-medium">Başlık:</span> {item.movie.originaltitle}
                          </div>
                          <div>
                            <span className="font-medium">Yıl:</span> {item.movie.startyear || 'Belirtilmemiş'}
                          </div>
                          <div>
                            <span className="font-medium">Süre:</span> {item.movie.runtimeminutes ? `${item.movie.runtimeminutes} dk` : 'Belirtilmemiş'}
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="font-medium">Çeviriler:</span>
                          <div className="mt-2 space-y-2">
                            {item.translations.map((trans, transIndex) => (
                              <div key={transIndex} className="pl-4 border-l-2 border-muted">
                                <div><span className="font-medium">Dil:</span> {trans.language_code}</div>
                                <div><span className="font-medium">Başlık:</span> {trans.primarytitle}</div>
                                {trans.description && (
                                  <div><span className="font-medium">Açıklama:</span> {trans.description.substring(0, 100)}...</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <h4 className="font-medium mb-2">JSON Format Kuralları:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Her film için <code>movie</code> ve <code>translations</code> alanları gerekli</li>
                    <li><code>imdb_id</code> ve <code>originaltitle</code> zorunlu alanlar</li>
                    <li>Her çeviri için <code>language_code</code> ve <code>primarytitle</code> zorunlu</li>
                    <li>Array formatında veri girin</li>
                    <li>JSON syntax'ına dikkat edin (tırnak, virgül, süslü parantez)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Örnek JSON Formatı:</Label>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {jsonExample}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Desteklenen Alanlar:</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium">Film Alanları:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      <li>imdb_id (zorunlu)</li>
                      <li>originaltitle (zorunlu)</li>
                      <li>startyear, endyear</li>
                      <li>runtimeminutes</li>
                      <li>averagerating</li>
                      <li>contentrating</li>
                      <li>type, url, primaryimage</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium">Çeviri Alanları:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      <li>language_code (zorunlu)</li>
                      <li>primarytitle (zorunlu)</li>
                      <li>description</li>
                      <li>genres (array)</li>
                      <li>interests (array)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
