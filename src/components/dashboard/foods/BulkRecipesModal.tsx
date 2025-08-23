import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFoodsApi } from '@/hooks/use-foods-api'
import { useLanguage } from '@/contexts/LanguageContext'
import { validateBulkRecipeData, cleanBulkRecipeData, detectDuplicateRecipes } from '@/lib/foods-utils'
import { supabase } from '@/api/supabase'
import { CheckCircle, XCircle, Info, Loader2 } from 'lucide-react'

interface BulkRecipesModalProps {
  isOpen: boolean
  onClose: () => void
}

interface BulkRecipeData {
  title: string
  description?: string
  instructions: string[]
  image_url?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  cuisine?: string // slug
  categories?: string[] // slug array
  tags?: string[] // slug array
  ingredients: Array<{
    name: string
    quantity: string
    unit: string
  }>
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data: BulkRecipeData[]
}

export function BulkRecipesModal({ isOpen, onClose }: BulkRecipesModalProps) {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const { 
    createRecipe,
    findCategoryIdByName,
    createRecipeCategory,
    findCuisineIdByName,
    createRecipeCuisine,
    findIngredientIdByName,
    createRecipeIngredient
  } = useFoodsApi()
  const [activeTab, setActiveTab] = useState('input')
  const [inputData, setInputData] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<Array<{ success: boolean; message: string; data?: any }>>([])

  // JSON input'u validate et
  const validateInput = useCallback(async () => {
    if (!inputData.trim()) {
      setValidationResult({
        isValid: false,
        errors: ['Lütfen veri girin'],
        warnings: [],
        data: []
      })
      // Hata varsa input tabında kal
      setActiveTab('input')
      return
    }

    try {
      // JSON parse
      const parsedData = JSON.parse(inputData)
      
      // Array kontrolü
      if (!Array.isArray(parsedData)) {
        setValidationResult({
          isValid: false,
          errors: ['Veri bir array olmalıdır'],
          warnings: [],
          data: []
        })
        // Hata varsa input tabında kal
        setActiveTab('input')
        return
      }

      // Her item'ı validate et
      const validationResults = parsedData.map((item, index) => {
        return validateBulkRecipeData(item, index + 1)
      })

      // Sonuçları birleştir
      const allErrors = validationResults.flatMap(r => r.errors)
      const allWarnings = validationResults.flatMap(r => r.warnings)
      let allData = validationResults.map(r => r.data).filter(Boolean)

      // Duplicate detection
      if (allData.length > 0) {
        try {
          // Mevcut tarifleri getir
          const { data: existingRecipes } = await supabase
            .from('food_recipes')
            .select('id')
          
          const { data: existingTranslations } = await supabase
            .from('food_recipe_translations')
            .select('recipe_id, language_code, title, instructions')
          
          // Translations'ı grupla
          const translationsByRecipe: Record<number, any[]> = {}
          existingTranslations?.forEach(t => {
            if (!translationsByRecipe[t.recipe_id]) {
              translationsByRecipe[t.recipe_id] = []
            }
            translationsByRecipe[t.recipe_id].push(t)
          })

          // Duplicate'ları bul
          const { duplicates, uniqueRecipes } = detectDuplicateRecipes(
            allData, 
            existingRecipes || [], 
            translationsByRecipe
          )

          // Duplicate uyarıları ekle
          if (duplicates.length > 0) {
            duplicates.forEach(dup => {
              allWarnings.push(`Tarif ${dup.index + 1}: ${dup.reason} (ID: ${dup.existingId})`)
            })
            
            // Sadece unique tarifleri işle
            allData = uniqueRecipes
          }
        } catch (error) {
          console.warn('Duplicate detection hatası:', error)
          // Hata durumunda tüm tarifleri işle
        }
      }

      const isValid = allErrors.length === 0

      setValidationResult({
        isValid,
        errors: allErrors,
        warnings: allWarnings,
        data: allData
      })

      // Doğrulama sonucuna göre tab değiştir
      if (isValid) {
        // Başarılı ise doğrulama tabına geç
        setActiveTab('validation')
      } else {
        // Hata varsa input tabında kal, hataları göster
        setActiveTab('input')
      }

    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`JSON parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        data: []
      })
      // Parse hatası varsa input tabında kal
      setActiveTab('input')
    }
  }, [inputData])

  // Toplu ekleme işlemi
  const handleBulkCreate = async () => {
    if (!validationResult?.isValid || !validationResult.data.length) return

    setIsProcessing(true)
    setProcessingProgress({ current: 0, total: validationResult.data.length })
    setResults([])

    // İşleme tabına geç
    setActiveTab('processing')

    const newResults: Array<{ success: boolean; message: string; data?: any }> = []

    for (let i = 0; i < validationResult.data.length; i++) {
      const recipeData = validationResult.data[i]
      
      try {
        // Recipe data'yı temizle ve format'la
        const cleanedData = cleanBulkRecipeData(recipeData, currentLanguage)
        
        // Ana recipe verisini ve çevirileri ayır
        const { translations, categories, cuisines, tags, ingredients, ...recipeDataWithoutTranslations } = cleanedData
        
        // difficulty alanını RecipeDifficulty tipine cast et
        const typedRecipeData = {
          ...recipeDataWithoutTranslations,
          difficulty: recipeDataWithoutTranslations.difficulty as 'Easy' | 'Medium' | 'Hard'
        }
        
        // Recipe oluştur
        const result = await createRecipe(typedRecipeData, translations)
        
        console.log('createRecipe result:', result)
        console.log('Recipe data:', typedRecipeData)
        console.log('Translations:', translations)
        
        if (result && result.id) {
          const recipeId = result.id
          console.log('Recipe ID found:', recipeId)
          let junctionResults = []
          
          // Kategorileri ekle
          if (categories && categories.length > 0) {
            try {
              for (const categoryName of categories) {
                // Kategori adından ID bul
                const categoryId = await findCategoryIdByName(categoryName)
                if (categoryId) {
                  await createRecipeCategory(recipeId, categoryId)
                  junctionResults.push(`Kategori: ${categoryName}`)
                }
              }
            } catch (error) {
              console.warn(`Kategoriler eklenirken hata:`, error)
            }
          }
          
          // Mutfakları ekle
          if (cuisines && cuisines.length > 0) {
            try {
              for (const cuisineName of cuisines) {
                // Mutfak adından ID bul
                const cuisineId = await findCuisineIdByName(cuisineName)
                if (cuisineId) {
                  await createRecipeCuisine(recipeId, cuisineId)
                  junctionResults.push(`Mutfak: ${cuisineName}`)
                }
              }
            } catch (error) {
              console.warn(`Mutfaklar eklenirken hata:`, error)
            }
          }
          
                        // Etiketleri ekle (Devre dışı - sadece kategoriler kullanılıyor)
              if (tags && tags.length > 0) {
                console.log(`⚠️ Etiketler devre dışı: ${tags.join(', ')} - sadece kategoriler kullanılıyor`)
                junctionResults.push(`Etiketler devre dışı: ${tags.join(', ')}`)
              }
          
          // Malzemeleri ekle
          if (ingredients && ingredients.length > 0) {
            try {
              for (const ingredient of ingredients) {
                // Malzeme adından ID bul
                const ingredientId = await findIngredientIdByName(ingredient.name)
                if (ingredientId) {
                  await createRecipeIngredient(recipeId, ingredientId, ingredient.quantity, ingredient.unit)
                  junctionResults.push(`Malzeme: ${ingredient.name}`)
                }
              }
            } catch (error) {
              console.warn(`Malzemeler eklenirken hata:`, error)
            }
          }
          
          const junctionInfo = junctionResults.length > 0 ? ` (${junctionResults.join(', ')})` : ''
          newResults.push({
            success: true,
            message: `"${recipeData.title}" başarıyla eklendi${junctionInfo}`,
            data: result
          })
        } else {
          newResults.push({
            success: false,
            message: `"${recipeData.title}" eklenirken hata: Recipe ID alınamadı`,
            data: result
          })
        }
        
      } catch (error) {
        newResults.push({
          success: false,
          message: `"${recipeData.title}" eklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
          data: error
        })
      }

      // Progress güncelle
      setProcessingProgress({ current: i + 1, total: validationResult.data.length })
      setResults([...newResults])

      // Kısa bir bekleme (API rate limit için)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setIsProcessing(false)
    
    // İşlem tamamlandığında sonuçlar tabına geç
    setActiveTab('results')
  }

  // Modal kapatıldığında state'i temizle
  const handleClose = () => {
    setInputData('')
    setValidationResult(null)
    setResults([])
    setProcessingProgress({ current: 0, total: 0 })
    setActiveTab('input')
    onClose()
  }

  // Başarılı sonuç sayısı
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            🚀 Toplu Tarif Ekleme
          </DialogTitle>
          <DialogDescription>
            Yüzlerce tarifi tek seferde ekleyin. JSON formatında array olarak girin.
          </DialogDescription>
          
          {/* Dil Seçici */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Hedef Dil:</span>
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Tarifler bu dilde eklenecek
            </span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="input">📝 Veri Girişi</TabsTrigger>
            <TabsTrigger value="validation">✅ Doğrulama</TabsTrigger>
            <TabsTrigger value="processing">⚙️ İşlem</TabsTrigger>
            <TabsTrigger value="results">📊 Sonuçlar</TabsTrigger>
          </TabsList>

          {/* Veri Girişi Tab */}
          <TabsContent value="input" className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">JSON Format Örneği:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`[
  {
    "title": "Somon Izgara",
    "description": "Taze somon balığı ızgara",
    "instructions": [
      "Somonu marine edin",
      "Izgarada pişirin",
      "Limon ile servis yapın"
    ],
    "ingredients": [
      {
        "name": "somon",
        "quantity": "500",
        "unit": "g"
      }
    ],
    "cuisine": "mediterranean",
    "categories": ["seafood", "grilled"],
    "tags": ["healthy", "quick"],
    "translations": {
      "tr": {
        "title": "Somon Izgara",
        "description": "Taze somon balığı ızgara",
        "instructions": [
          "Somonu marine edin",
          "Izgarada pişirin",
          "Limon ile servis yapın"
        ]
      },
      "en": {
        "title": "Grilled Salmon",
        "description": "Fresh grilled salmon fish",
        "instructions": [
          "Marinate the salmon",
          "Grill it",
          "Serve with lemon"
        ]
      },
      "de": {
        "title": "Gegrillter Lachs",
        "description": "Frischer gegrillter Lachs",
        "instructions": [
          "Lachs marinieren",
          "Grillen",
          "Mit Zitrone servieren"
        ]
      }
    }
  }
]`}
                </pre>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Veri Kuralları:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  
                  {/* Translations Açıklaması */}
                  <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">🌍 Çoklu Dil Desteği:</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Her tarif için <code className="bg-blue-100 px-1 rounded">translations</code> objesi ekleyerek 
                      birden fazla dilde içerik girebilirsiniz. Ana dil alanları (title, description, instructions) 
                      fallback olarak kullanılır.
                    </p>
                    <div className="text-xs text-blue-600">
                      <strong>Desteklenen Diller:</strong> tr, en, de, fr, es
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600">Zorunlu Alanlar:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>title (string) - Ana dilde başlık</li>
                      <li>instructions (string array) - Ana dilde talimatlar</li>
                      <li>ingredients (object array) - Malzeme listesi</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600">Opsiyonel Alanlar:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>description (string) - Ana dilde açıklama</li>
                      <li>image_url (string) - Resim URL'i</li>
                      <li>prep_time_minutes (number) - Hazırlık süresi</li>
                      <li>cook_time_minutes (number) - Pişirme süresi</li>
                      <li>servings (number) - Porsiyon sayısı</li>
                      <li>difficulty (Easy/Medium/Hard) - Zorluk seviyesi</li>
                      <li>cuisine (slug) - Mutfak türü</li>
                      <li>categories (slug array) - Kategori listesi</li>
                      <li>tags (slug array) - Etiket listesi</li>
                      <li>translations (object) - Çoklu dil desteği</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">JSON Verinizi Girin:</h3>
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="JSON array formatında tarif verilerini girin..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => validateInput()} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Veriyi Doğrula
                </Button>
                <Button variant="outline" onClick={() => setInputData('')}>
                  Temizle
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Doğrulama Tab */}
          <TabsContent value="validation" className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {!validationResult ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Önce "Veri Girişi" tab'ında veriyi doğrulayın</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Genel Durum */}
                <Alert className={validationResult.isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
                    {validationResult.isValid 
                      ? `✅ ${validationResult.data.length} tarif başarıyla doğrulandı!` 
                      : `❌ ${validationResult.errors.length} hata bulundu!`
                    }
                  </AlertDescription>
                </Alert>

                {/* Hatalar */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">
                      ❌ Hatalar ({validationResult.errors.length})
                    </h3>
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uyarılar */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                      ⚠️ Uyarılar ({validationResult.warnings.length})
                    </h3>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Bilgisi */}
                {validationResult.warnings.some(w => w.includes('Aynı başlık') || w.includes('Aynı tarif adımları')) && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">
                      🔍 Duplicate Kontrolü
                    </h3>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                      <p className="font-medium mb-2">Aynı tarifler tespit edildi ve atlandı:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.warnings
                          .filter(w => w.includes('Aynı başlık') || w.includes('Aynı tarif adımları'))
                          .map((warning, index) => (
                            <li key={index} className="text-xs">{warning}</li>
                          ))}
                      </ul>
                      <p className="mt-2 text-xs text-blue-600">
                        Sadece benzersiz tarifler işleme alınacak.
                      </p>
                    </div>
                  </div>
                )}

                {/* Doğrulanan Veriler */}
                {validationResult.isValid && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      ✅ Doğrulanan Tarifler ({validationResult.data.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {validationResult.data.slice(0, 10).map((recipe, index) => (
                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="font-medium text-green-800">{recipe.title}</div>
                          <div className="text-sm text-green-600">
                            {recipe.ingredients.length} malzeme • {recipe.instructions.length} adım
                          </div>
                        </div>
                      ))}
                      {validationResult.data.length > 10 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-center">
                          +{validationResult.data.length - 10} tarif daha...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* İşlem Butonu */}
                {validationResult.isValid && (
                  <Button 
                    onClick={handleBulkCreate} 
                    className="w-full"
                    size="lg"
                  >
                    🚀 {validationResult.data.length} Tarifi Toplu Ekle
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* İşlem Tab */}
          <TabsContent value="processing" className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {!isProcessing ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Önce "Doğrulama" tab'ında işlemi başlatın</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-600 mb-2">
                    Tarifler Ekleniyor...
                  </h3>
                  <p className="text-gray-600">
                    {processingProgress.current} / {processingProgress.total} tarif işlendi
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
                  ></div>
                </div>

                {/* Son Sonuçlar */}
                {results.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Son İşlenenler:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {results.slice(-5).map((result, index) => (
                        <div 
                          key={index} 
                          className={`p-2 rounded-lg text-sm ${
                            result.success 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {result.success ? '✅' : '❌'} {result.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Sonuçlar Tab */}
          <TabsContent value="results" className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {results.length === 0 ? (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz işlem yapılmadı</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Özet */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-green-700">Başarılı</div>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                    <div className="text-sm text-red-700">Başarısız</div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                    <div className="text-sm text-blue-700">Toplam</div>
                  </div>
                </div>

                {/* Detaylı Sonuçlar */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Detaylı Sonuçlar:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {results.map((result, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border ${
                          result.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                            {result.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tamamlandı Mesajı */}
                {!isProcessing && results.length > 0 && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      🎉 Toplu ekleme işlemi tamamlandı! {successCount} tarif başarıyla eklendi.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
