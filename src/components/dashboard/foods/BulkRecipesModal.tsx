import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFoodsApi } from '@/hooks/use-foods-api'
import { useLanguage } from '@/contexts/LanguageContext'
import { validateBulkRecipeData, cleanBulkRecipeData, detectDuplicateRecipes } from '@/lib/foods-utils'
import { supabase } from '@/api/supabase'
import { CheckCircle, XCircle, Info, Loader2, Zap, Database, FileText } from 'lucide-react'
import { 
  THEMEALDB_TAG_MAPPING, 
  THEMEALDB_CUISINE_MAPPING, 
  THEMEALDB_CATEGORY_MAPPING 
} from '@/lib/food-constants'

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
  cuisines?: string[] // slug array (alternatif)
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

// Cache sistemi için interface
interface IngredientCache {
  [name: string]: number // name -> id mapping
}

interface CategoryCache {
  [name: string]: number // name -> id mapping
}

interface CuisineCache {
  [name: string]: number // name -> id mapping
}

export function BulkRecipesModal({ isOpen, onClose }: BulkRecipesModalProps) {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const { 
    createRecipe,
    findCategoryIdByName,
    createRecipeCategory,
    findCuisineIdByName,
    findIngredientIdByName,
    createRecipeIngredient
  } = useFoodsApi()
  
  const [activeTab, setActiveTab] = useState('input')
  const [inputData, setInputData] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<Array<{ success: boolean; message: string; data?: any }>>([])
  
  // Cache sistemleri
  const ingredientCache = useRef<IngredientCache>({})
  const categoryCache = useRef<CategoryCache>({})
  const cuisineCache = useRef<CuisineCache>({})
  
  // Format seçimi
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'themedb' | 'direct'>('json')

  // Cache'i temizle
  const clearCache = () => {
    ingredientCache.current = {}
    categoryCache.current = {}
    cuisineCache.current = {}
  }

  // Batch işleme için malzeme ID'lerini bul
  const batchFindIngredientIds = async (ingredientNames: string[]): Promise<Map<string, number>> => {
    const result = new Map<string, number>()
    const batchSize = 5 // Aynı anda 5 sorgu
    
    for (let i = 0; i < ingredientNames.length; i += batchSize) {
      const batch = ingredientNames.slice(i, i + batchSize)
      
      // Cache'den kontrol et
      const uncachedNames = batch.filter(name => !ingredientCache.current[name])
      
      if (uncachedNames.length > 0) {
        // Paralel olarak bul
        const promises = uncachedNames.map(async (name) => {
          const id = await findIngredientIdByName(name)
          if (id) {
            ingredientCache.current[name] = id
          }
          return { name, id }
        })
        
        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ name, id }) => {
          if (id) result.set(name, id)
        })
      }
      
      // Cache'den ekle
      batch.forEach(name => {
        if (ingredientCache.current[name]) {
          result.set(name, ingredientCache.current[name])
        }
      })
    }
    
    return result
  }

  // Batch işleme için kategori ID'lerini bul
  const batchFindCategoryIds = async (categoryNames: string[]): Promise<Map<string, number>> => {
    const result = new Map<string, number>()
    const batchSize = 5
    
    for (let i = 0; i < categoryNames.length; i += batchSize) {
      const batch = categoryNames.slice(i, i + batchSize)
      
      const uncachedNames = batch.filter(name => !categoryCache.current[name])
      
      if (uncachedNames.length > 0) {
        const promises = uncachedNames.map(async (name) => {
          const id = await findCategoryIdByName(name)
          if (id) {
            categoryCache.current[name] = id
          }
          return { name, id }
        })
        
        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ name, id }) => {
          if (id) result.set(name, id)
        })
      }
      
      batch.forEach(name => {
        if (categoryCache.current[name]) {
          result.set(name, categoryCache.current[name])
        }
      })
    }
    
    return result
  }

  // Batch işleme için mutfak ID'lerini bul
  const batchFindCuisineIds = async (cuisineNames: string[]): Promise<Map<string, number>> => {
    const result = new Map<string, number>()
    const batchSize = 5
    
    for (let i = 0; i < cuisineNames.length; i += batchSize) {
      const batch = cuisineNames.slice(i, i + batchSize)
      
      const uncachedNames = batch.filter(name => !cuisineCache.current[name])
      
      if (uncachedNames.length > 0) {
        const promises = uncachedNames.map(async (name) => {
          const id = await findCuisineIdByName(name)
          if (id) {
            cuisineCache.current[name] = id
          }
          return { name, id }
        })
        
        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ name, id }) => {
          if (id) result.set(name, id)
        })
      }
      
      batch.forEach(name => {
        if (cuisineCache.current[name]) {
          result.set(name, cuisineCache.current[name])
        }
      })
    }
    
    return result
  }

  // TheMealDB formatını bizim formatımıza çevir
  // Cuisine mapping - TheMealDB strArea -> food_cuisines ID
  const cuisineMapping = THEMEALDB_CUISINE_MAPPING

  // Category mapping - TheMealDB strCategory -> food_categories ID
  const categoryMapping = THEMEALDB_CATEGORY_MAPPING

  // Tag mapping - TheMealDB strTags -> food_tags ID
  const tagMapping = THEMEALDB_TAG_MAPPING

  // TheMealDB formatını bizim formatımıza çevir
  const convertTheMealDBFormat = (themedbData: any): BulkRecipeData[] => {
    if (!themedbData.meals || !Array.isArray(themedbData.meals)) {
      throw new Error('TheMealDB formatı geçersiz')
    }

  return themedbData.meals.map((meal: any) => {
    // Malzemeleri çıkar (strIngredient1-20)
    const ingredients: Array<{ name: string; quantity: string; unit: string }> = []
    
    for (let i = 1; i <= 20; i++) {
      const ingredientName = meal[`strIngredient${i}`]
      const measure = meal[`strMeasure${i}`]
      
      if (ingredientName && ingredientName.trim()) {
        // Measure'dan quantity ve unit'i ayır
        let quantity = '1'
        let unit = 'piece'
        
        if (measure && measure.trim()) {
          // Gelişmiş parsing (örn: "2 tbs" -> quantity: "2", unit: "tbs")
          const match = measure.match(/^(\d+(?:\.\d+)?)\s*(.+)$/)
          if (match) {
            quantity = match[1]
            unit = match[2].trim()
          } else {
            // Sadece sayı varsa
            const numMatch = measure.match(/^(\d+(?:\.\d+)?)/)
            if (numMatch) {
              quantity = numMatch[1]
              unit = 'piece'
            } else {
              // Sadece metin varsa (örn: "sliced", "chopped")
              quantity = '1'
              unit = measure.trim()
            }
          }
        }
        
        ingredients.push({
          name: ingredientName.trim(),
          quantity: quantity,
          unit: unit
        })
      }
    }

    // Instructions'ı satır satır böl
    const instructions = meal.strInstructions 
      ? meal.strInstructions.split(/\r?\n/).filter((line: string) => line.trim())
      : ['No instructions provided']

    // TheMealDB'de olmayan veriler için NULL kullan
    // Bu alanlar daha sonra manuel olarak doldurulabilir
    
          // Cuisine ID'sini bul
      const cuisineId = meal.strArea ? cuisineMapping[meal.strArea] : null
      const cuisineSlug = cuisineId ? cuisineId.toString() : ''
      
      // Debug: Cuisine mapping kontrolü
      console.log(`🔍 Cuisine mapping: strArea="${meal.strArea}" -> cuisineId=${cuisineId} -> cuisineSlug="${cuisineSlug}"`)
      
      // Category ID'sini bul
      const categoryId = meal.strCategory ? categoryMapping[meal.strCategory] : null
      const categorySlug = categoryId ? categoryId.toString() : ''
      
      // Debug: Category mapping kontrolü
      console.log(`🔍 Category mapping: strCategory="${meal.strCategory}" -> categoryId=${categoryId} -> categorySlug="${categorySlug}"`)
      
      // Tag ID'lerini bul
      const tagSlugs = meal.strTags ? meal.strTags.split(',').map((tag: string) => {
        const tagId = tagMapping[tag.trim()]
        return tagId ? tagId.toString() : ''
      }).filter((slug: string) => slug) : []
      
      // Instructions'dan süre bilgilerini bul
      const instructionsText = meal.strInstructions || ''
      
      // Dakika bilgilerini bul (örn: "5 mins", "10 minutes", "2-3 min")
      const timePatterns = [
        /(\d+)\s*(?:mins?|minutes?|dakika)/gi,
        /(\d+)\s*-\s*(\d+)\s*(?:mins?|minutes?|dakika)/gi,
        /(\d+)\s*(?:saat|hour)/gi
      ]
      
      let totalMinutes = 0
      let cookTimeMinutes = 0
      
              timePatterns.forEach(pattern => {
          const matches = instructionsText.match(pattern)
          if (matches) {
            matches.forEach((match: string) => {
            if (pattern.source.includes('-')) {
              // Range pattern (örn: "2-3 mins")
              const rangeMatch = match.match(/(\d+)\s*-\s*(\d+)/)
              if (rangeMatch) {
                const min = parseInt(rangeMatch[1])
                const max = parseInt(rangeMatch[2])
                const avg = Math.round((min + max) / 2)
                totalMinutes += avg
                cookTimeMinutes += avg
              }
            } else {
              // Single number pattern
              const numMatch = match.match(/(\d+)/)
              if (numMatch) {
                const minutes = parseInt(numMatch[1])
                if (pattern.source.includes('saat') || pattern.source.includes('hour')) {
                  totalMinutes += minutes * 60
                  cookTimeMinutes += minutes * 60
                } else {
                  totalMinutes += minutes
                  cookTimeMinutes += minutes
                }
              }
            }
          })
        }
      })
      
      // Eğer süre bulunamazsa varsayılan değerler
      const prepTimeMinutes = Math.max(10, Math.round(totalMinutes * 0.3)) // Hazırlık süresi
      const finalCookTimeMinutes = cookTimeMinutes > 0 ? cookTimeMinutes : 30
      const servings = 4 // Varsayılan porsiyon
      
      return {
        title: meal.strMeal || 'Untitled Recipe',
        description: meal.strInstructions?.substring(0, 200) + '...' || 'No description provided',
        instructions: instructions,
        image_url: meal.strMealThumb || '',
        prep_time_minutes: prepTimeMinutes,
        cook_time_minutes: finalCookTimeMinutes,
        servings: servings,
        difficulty: 'Medium', // Varsayılan zorluk
        cuisine: cuisineSlug,
        cuisines: cuisineSlug ? [cuisineSlug] : [],
        categories: categorySlug ? [categorySlug] : [],
        tags: tagSlugs,
        ingredients: ingredients
      }
  })
}

  // Direkt DB formatını bizim formatımıza çevir
  const convertDirectDBFormat = (directData: any): BulkRecipeData[] => {
    console.log('convertDirectDBFormat çağrıldı:', directData)
    console.log('recipes var mı?', !!directData.recipes)
    console.log('recipes array mi?', Array.isArray(directData.recipes))
    
    if (!directData.recipes || !Array.isArray(directData.recipes)) {
      console.error('Recipes bulunamadı:', directData)
      throw new Error('Direkt format için recipes array gerekli')
    }

    return directData.recipes.map((recipe: any) => {
      // Recipe translations'dan title ve instructions'ı al
      const translations = directData.recipe_translations || []
      const recipeTranslations = translations.filter((t: any) => t.recipe_id === recipe.id)
      
      // Ana dil çevirisini bul (ilk bulunan)
      const mainTranslation = recipeTranslations[0] || {}
      
      // Malzemeleri recipe_ingredients'dan al
      const recipeIngredients = directData.recipe_ingredients || []
      const ingredients = recipeIngredients
        .filter((ri: any) => ri.recipe_id === recipe.id)
        .map((ri: any) => {
          // Mevcut veritabanındaki ingredient ID'lerini kullan
          // Translation tablosu olmadığı için sadece ID'yi kullan
          return {
            name: `Ingredient ${ri.ingredient_id}`, // Bu daha sonra DB'den çekilecek
            quantity: ri.quantity,
            unit: ri.unit
          }
        })

      // Kategorileri recipe_categories'dan al
      const recipeCategories = directData.recipe_categories || []
      const categories = recipeCategories
        .filter((rc: any) => rc.recipe_id === recipe.id)
        .map((rc: any) => {
          // Mevcut veritabanındaki category ID'lerini kullan
          return `category-${rc.category_id}` // Bu daha sonra DB'den çekilecek
        })

      // Mutfakları recipe_cuisines'dan al
      const recipeCuisines = directData.recipe_cuisines || []
      const cuisines = recipeCuisines
        .filter((rc: any) => rc.recipe_id === recipe.id)
        .map((rc: any) => {
          // Mevcut veritabanındaki cuisine ID'lerini kullan
          return `cuisine-${rc.cuisine_id}` // Bu daha sonra DB'den çekilecek
        })

      return {
        title: mainTranslation.title || `Recipe ${recipe.id}`,
        description: mainTranslation.description || '',
        instructions: mainTranslation.instructions || ['Instructions not available'],
        image_url: recipe.image_url || '',
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty || 'Medium',
        cuisine: cuisines[0] || '',
        cuisines: cuisines,
        categories: categories,
        tags: [],
        ingredients: ingredients
      }
    })
  }

  // JSON input'u validate et
  const validateInput = useCallback(async () => {
    if (!inputData.trim()) {
      setValidationResult({
        isValid: false,
        errors: ['Lütfen veri girin'],
        warnings: [],
        data: []
      })
      setActiveTab('input')
      return
    }

    try {
      let parsedData: any
      
      // Format'a göre parse et
      if (selectedFormat === 'themedb') {
        parsedData = JSON.parse(inputData)
        const convertedData = convertTheMealDBFormat(parsedData)
        parsedData = convertedData
      } else if (selectedFormat === 'direct') {
        console.log('Direkt format seçildi')
        parsedData = JSON.parse(inputData)
        console.log('JSON parse edildi:', parsedData)
        const convertedData = convertDirectDBFormat(parsedData)
        console.log('Dönüştürüldü:', convertedData)
        parsedData = convertedData
      } else {
        // Standart JSON format
        parsedData = JSON.parse(inputData)
      }
      
      // Array kontrolü
      if (!Array.isArray(parsedData)) {
        setValidationResult({
          isValid: false,
          errors: ['Veri bir array olmalıdır'],
          warnings: [],
          data: []
        })
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
        setActiveTab('validation')
      } else {
        setActiveTab('input')
      }

    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`JSON parse hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`],
        warnings: [],
        data: []
      })
      setActiveTab('input')
    }
  }, [inputData, selectedFormat])

  // Toplu ekleme işlemi (Geliştirilmiş)
  const handleBulkCreate = async () => {
    if (!validationResult?.isValid || !validationResult.data.length) return

    setIsProcessing(true)
    setProcessingProgress({ current: 0, total: validationResult.data.length })
    setResults([])
    setActiveTab('processing')

    // Cache'i temizle
    clearCache()

    const newResults: Array<{ success: boolean; message: string; data?: any }> = []

    // Batch işleme için tüm malzeme, kategori ve mutfak isimlerini topla
    const allIngredientNames = new Set<string>()
    const allCategoryNames = new Set<string>()
    const allCuisineNames = new Set<string>()

    validationResult.data.forEach(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients.forEach(ing => allIngredientNames.add(ing.name))
      }
      if (recipe.categories) {
        recipe.categories.forEach(cat => allCategoryNames.add(cat))
      }
      if (recipe.cuisines) {
        recipe.cuisines.forEach(cuisine => allCuisineNames.add(cuisine))
      }
    })

    // Batch olarak tüm ID'leri bul
    console.log('🔍 Batch ID arama başlatılıyor...')
    const [ingredientIds, categoryIds, cuisineIds] = await Promise.all([
      batchFindIngredientIds(Array.from(allIngredientNames)),
      batchFindCategoryIds(Array.from(allCategoryNames)),
      batchFindCuisineIds(Array.from(allCuisineNames))
    ])

    console.log(`✅ Batch ID arama tamamlandı: ${ingredientIds.size} malzeme, ${categoryIds.size} kategori, ${cuisineIds.size} mutfak`)

    // Her tarifi işle
    for (let i = 0; i < validationResult.data.length; i++) {
      const recipeData = validationResult.data[i]
      
      try {
        // Recipe data'yı temizle ve format'la
        const cleanedData = cleanBulkRecipeData(recipeData, currentLanguage)
        
        // Ana recipe verisini ve çevirileri ayır
        const { translations, categories, cuisines, tags, ingredients, ...recipeDataWithoutTranslations } = cleanedData
        
        // Cuisine ID'yi recipe data'ya ekle
        let recipeDataWithCuisine = { ...recipeDataWithoutTranslations }
        if (cuisines && cuisines.length > 0) {
          const cuisineId = parseInt(cuisines[0]) // String'i number'a çevir
          if (!isNaN(cuisineId)) {
            recipeDataWithCuisine.cuisine_id = cuisineId
            console.log(`✅ Cuisine ID eklendi: ${cuisineId}`)
          }
        }
        
        // difficulty alanını RecipeDifficulty tipine cast et
        const typedRecipeData = {
          ...recipeDataWithCuisine,
          difficulty: recipeDataWithCuisine.difficulty as 'Easy' | 'Medium' | 'Hard'
        }
        
        // Recipe oluştur
        const result = await createRecipe(typedRecipeData, translations)
        
        if (result && result.id) {
          const recipeId = result.id
          let junctionResults = []
          
          // Kategorileri ekle (batch işleme ile)
          if (categories && categories.length > 0) {
            try {
              for (const categoryName of categories) {
                const categoryId = categoryIds.get(categoryName)
                if (categoryId) {
                  await createRecipeCategory(recipeId, categoryId)
                  junctionResults.push(`Kategori: ${categoryName}`)
                }
              }
            } catch (error) {
              console.warn(`Kategoriler eklenirken hata:`, error)
            }
          }
          
          // Mutfak bilgisi artık createRecipe sırasında ekleniyor
          if (cuisines && cuisines.length > 0) {
            const cuisineName = cuisines[0]
            const cuisineId = cuisineIds.get(cuisineName)
            if (cuisineId) {
              junctionResults.push(`Mutfak: ${cuisineName} (ID: ${cuisineId})`)
            }
          }
          
          // Etiketleri ekle (Devre dışı - sadece kategoriler kullanılıyor)
          if (tags && tags.length > 0) {
            console.log(`⚠️ Etiketler devre dışı: ${tags.join(', ')} - sadece kategoriler kullanılıyor`)
            junctionResults.push(`Etiketler devre dışı: ${tags.join(', ')}`)
          }
          
          // Malzemeleri ekle (batch işleme ile)
          if (ingredients && ingredients.length > 0) {
            try {
              for (const ingredient of ingredients) {
                const ingredientId = ingredientIds.get(ingredient.name)
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
      await new Promise(resolve => setTimeout(resolve, 50)) // 100ms'den 50ms'ye düşürdük
    }

    setIsProcessing(false)
    setActiveTab('results')
  }

  // Modal kapatıldığında state'i temizle
  const handleClose = () => {
    setInputData('')
    setValidationResult(null)
    setResults([])
    setProcessingProgress({ current: 0, total: 0 })
    setActiveTab('input')
    clearCache()
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
            Yüzlerce tarifi tek seferde ekleyin. Farklı formatları destekler.
          </DialogDescription>
          
          {/* Format Seçici */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Veri Formatı:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="px-3 py-1 text-sm border rounded-md bg-background"
              >
                <option value="json">📝 Standart JSON</option>
                <option value="themedb">🍽️ TheMealDB Format</option>
                <option value="direct">🗄️ Direkt DB Format</option>
              </select>
            </div>
            
            {/* Dil Seçici */}
            <div className="flex items-center gap-2">
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
            </div>
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
              
              {/* Format Açıklamaları */}
              <div className="grid grid-cols-1 gap-4">
                
                {/* Standart JSON Format */}
                {selectedFormat === 'json' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Standart JSON Format
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Her tarif için title, instructions, ingredients gibi alanları içeren standart format.
                    </p>
                    <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Somon Izgara",
    "ingredients": [
      { "name": "somon", "quantity": "500", "unit": "g" }
    ],
    "instructions": ["Marine et", "Izgara yap"],
    "cuisine": "mediterranean",
    "categories": ["seafood", "grilled"]
  }
]`}
                    </pre>
                  </div>
                )}

                {/* TheMealDB Format */}
                {selectedFormat === 'themedb' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      TheMealDB Format
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      TheMealDB API'den gelen orijinal format. Otomatik olarak bizim formatımıza çevrilir.
                    </p>
                    <pre className="bg-green-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "meals": [
    {
      "strMeal": "Yaki Udon",
      "strCategory": "Vegetarian",
      "strArea": "Japanese",
      "strIngredient1": "Udon Noodles",
      "strMeasure1": "250g",
      "strInstructions": "Boil water..."
    }
  ]
}`}
                    </pre>
                  </div>
                )}

                {/* Direkt DB Format */}
                {selectedFormat === 'direct' && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Direkt DB Format
                    </h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Bizim DB şemamıza uygun direkt format. En hızlı işlem için.
                    </p>
                    <pre className="bg-purple-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "recipes": [...],
  "ingredients": [...],
  "recipe_ingredients": [...],
  "categories": [...],
  "cuisines": [...]
}`}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">JSON Verinizi Girin:</h3>
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={`${selectedFormat === 'themedb' ? 'TheMealDB JSON formatında veri girin...' : selectedFormat === 'direct' ? 'Direkt DB formatında veri girin...' : 'Standart JSON formatında veri girin...'}`}
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
                <Button variant="outline" onClick={clearCache} title="Cache'i temizle">
                  <Zap className="h-4 w-4" />
                  Cache Temizle
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
