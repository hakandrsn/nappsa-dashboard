import type { 
  FoodRecipe, 
  FoodIngredient, 
  FoodCategory, 
  FoodCuisine, 
  FoodTag,
  FoodRecipeTranslation,
  FoodIngredientTranslation,
  FoodCategoryTranslation,
  FoodCuisineTranslation,
  FoodTagTranslation,
  CreateFoodRecipe,
  CreateFoodIngredient,
  CreateFoodCategory,
  CreateFoodCuisine,
  CreateFoodTag,
  RecipeDifficulty
} from '@/api/types'

// =============================================
// VALIDATION FONKSİYONLARI
// =============================================

// Tarif verilerini doğrula
export function validateRecipeData(recipeData: Partial<CreateFoodRecipe>): string[] {
  const errors: string[] = []

  if (recipeData.prep_time_minutes && recipeData.prep_time_minutes < 0) {
    errors.push('Hazırlık süresi negatif olamaz')
  }

  if (recipeData.cook_time_minutes && recipeData.cook_time_minutes < 0) {
    errors.push('Pişirme süresi negatif olamaz')
  }

  if (recipeData.servings && recipeData.servings < 1) {
    errors.push('Porsiyon sayısı en az 1 olmalı')
  }

  return errors
}

// Malzeme verilerini doğrula
export function validateIngredientData(): string[] {
  const errors: string[] = []

  // source_id opsiyonel olduğu için validasyon gerekmiyor
  return errors
}

// Kategori verilerini doğrula
export function validateCategoryData(categoryData: Partial<CreateFoodCategory>): string[] {
  const errors: string[] = []

  if (!categoryData.slug || categoryData.slug.trim() === '') {
    errors.push('Slug zorunludur')
  }

  if (categoryData.slug && !/^[a-z0-9-]+$/.test(categoryData.slug)) {
    errors.push('Slug sadece küçük harf, rakam ve tire içerebilir')
  }

  return errors
}

// Mutfak verilerini doğrula
export function validateCuisineData(cuisineData: Partial<CreateFoodCuisine>): string[] {
  const errors: string[] = []

  if (!cuisineData.slug || cuisineData.slug.trim() === '') {
    errors.push('Slug zorunludur')
  }

  if (cuisineData.slug && !/^[a-z0-9-]+$/.test(cuisineData.slug)) {
    errors.push('Slug sadece küçük harf, rakam ve tire içerebilir')
  }

  return errors
}

// Etiket verilerini doğrula
export function validateTagData(tagData: Partial<CreateFoodTag>): string[] {
  const errors: string[] = []

  if (!tagData.slug || tagData.slug.trim() === '') {
    errors.push('Slug zorunludur')
  }

  if (tagData.slug && !/^[a-z0-9-]+$/.test(tagData.slug)) {
    errors.push('Slug sadece küçük harf, rakam ve tire içerebilir')
  }

  return errors
}

// Çeviri verilerini doğrula
export function validateTranslationData(translation: any, type: 'recipe' | 'ingredient' | 'category' | 'cuisine' | 'tag'): string[] {
  const errors: string[] = []

  if (!translation.language_code || translation.language_code.trim() === '') {
    errors.push('Dil kodu zorunludur')
  }

  switch (type) {
    case 'recipe':
      if (!translation.title || translation.title.trim() === '') {
        errors.push('Tarif başlığı zorunludur')
      }
      break
    case 'ingredient':
      if (!translation.name || translation.name.trim() === '') {
        errors.push('Malzeme adı zorunludur')
      }
      break
    case 'category':
      if (!translation.name || translation.name.trim() === '') {
        errors.push('Kategori adı zorunludur')
      }
      break
    case 'cuisine':
      if (!translation.name || translation.name.trim() === '') {
        errors.push('Mutfak adı zorunludur')
      }
      break
    case 'tag':
      if (!translation.name || translation.name.trim() === '') {
        errors.push('Etiket adı zorunludur')
      }
      break
  }

  return errors
}

// =============================================
// ÇOKLU VERİ VALIDASYONU
// =============================================

// Çoklu tarif verilerini doğrula
export function validateMultipleRecipesData(recipesData: Array<{
  recipe: Partial<CreateFoodRecipe>
  translations: Partial<FoodRecipeTranslation>[]
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (recipesData.length === 0) {
    errors.push('En az bir tarif verisi gerekli')
    return { valid: false, errors }
  }

  recipesData.forEach((item, index) => {
    const recipeErrors = validateRecipeData(item.recipe)
    if (recipeErrors.length > 0) {
      errors.push(`Tarif ${index + 1}: ${recipeErrors.join(', ')}`)
    }

    if (item.translations.length === 0) {
      errors.push(`Tarif ${index + 1}: En az bir çeviri gerekli`)
    } else {
      item.translations.forEach((translation, transIndex) => {
        const translationErrors = validateTranslationData(translation, 'recipe')
        if (translationErrors.length > 0) {
          errors.push(`Tarif ${index + 1}, Çeviri ${transIndex + 1}: ${translationErrors.join(', ')}`)
        }
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// Çoklu malzeme verilerini doğrula
export function validateMultipleIngredientsData(ingredientsData: Array<{
  ingredient: Partial<CreateFoodIngredient>
  translations: Partial<FoodIngredientTranslation>[]
}>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (ingredientsData.length === 0) {
    errors.push('En az bir malzeme verisi gerekli')
    return { valid: false, errors }
  }

  ingredientsData.forEach((item, index) => {
            const ingredientErrors = validateIngredientData()
    if (ingredientErrors.length > 0) {
      errors.push(`Malzeme ${index + 1}: ${ingredientErrors.join(', ')}`)
    }

    if (item.translations.length === 0) {
      errors.push(`Malzeme ${index + 1}: En az bir çeviri gerekli`)
    } else {
      item.translations.forEach((translation, transIndex) => {
        const translationErrors = validateTranslationData(translation, 'ingredient')
        if (translationErrors.length > 0) {
          errors.push(`Malzeme ${index + 1}, Çeviri ${transIndex + 1}: ${translationErrors.join(', ')}`)
        }
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// =============================================
// VERİ TEMİZLEME FONKSİYONLARI
// =============================================

// Tarif verilerini temizle
export function cleanRecipeData(recipeData: Partial<CreateFoodRecipe>): Partial<CreateFoodRecipe> {
  const cleaned: any = {}
  
  Object.entries(recipeData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// Malzeme verilerini temizle
export function cleanIngredientData(ingredientData: Partial<CreateFoodIngredient>): Partial<CreateFoodIngredient> {
  const cleaned: any = {}
  
  Object.entries(ingredientData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// Kategori verilerini temizle
export function cleanCategoryData(categoryData: Partial<CreateFoodCategory>): Partial<CreateFoodCategory> {
  const cleaned: any = {}
  
  Object.entries(categoryData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// Mutfak verilerini temizle
export function cleanCuisineData(cuisineData: Partial<CreateFoodCuisine>): Partial<CreateFoodCuisine> {
  const cleaned: any = {}
  
  Object.entries(cuisineData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// Etiket verilerini temizle
export function cleanTagData(tagData: Partial<CreateFoodTag>): Partial<CreateFoodTag> {
  const cleaned: any = {}
  
  Object.entries(tagData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// Çeviri verilerini temizle
export function cleanTranslationData(translation: any): any {
  const cleaned: any = {}
  
  Object.entries(translation).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}

// =============================================
// FORMATLAMA FONKSİYONLARI
// =============================================

// Tarif verilerini formatla
export function formatRecipeData(recipe: FoodRecipe, translations?: FoodRecipeTranslation[], languageCode = 'tr'): {
  id: number
  title: string
  difficulty: string
  prepTime: string
  cookTime: string
  servings: string
  image: string | null
} {
  const currentTranslation = translations?.find(t => t.language_code === languageCode)
  const title = currentTranslation?.title || 'Başlık Yok'
  
  return {
    id: recipe.id,
    title,
    difficulty: recipe.difficulty || 'Belirtilmemiş',
    prepTime: recipe.prep_time_minutes ? `${recipe.prep_time_minutes} dk` : 'Belirtilmemiş',
    cookTime: recipe.cook_time_minutes ? `${recipe.cook_time_minutes} dk` : 'Belirtilmemiş',
    servings: recipe.servings ? `${recipe.servings} kişi` : 'Belirtilmemiş',
    image: recipe.image_url || null
  }
}

// Malzeme verilerini formatla
export function formatIngredientData(ingredient: FoodIngredient, translations?: FoodIngredientTranslation[], languageCode = 'tr'): {
  id: number
  name: string
  sourceId: string | null
} {
  const currentTranslation = translations?.find(t => t.language_code === languageCode)
  const name = currentTranslation?.name || 'Ad Yok'
  
  return {
    id: ingredient.id,
    name,
    sourceId: ingredient.source_id || null
  }
}

// Kategori verilerini formatla
export function formatCategoryData(category: FoodCategory, translations?: FoodCategoryTranslation[], languageCode = 'tr'): {
  id: number
  name: string
  slug: string
} {
  const currentTranslation = translations?.find(t => t.language_code === languageCode)
  const name = currentTranslation?.name || 'Ad Yok'
  
  return {
    id: category.id,
    name,
    slug: category.slug
  }
}

// Mutfak verilerini formatla
export function formatCuisineData(cuisine: FoodCuisine, translations?: FoodCuisineTranslation[], languageCode = 'tr'): {
  id: number
  name: string
  slug: string
} {
  const currentTranslation = translations?.find(t => t.language_code === languageCode)
  const name = currentTranslation?.name || 'Ad Yok'
  
  return {
    id: cuisine.id,
    name,
    slug: cuisine.slug
  }
}

// Etiket verilerini formatla
export function formatTagData(tag: FoodTag, translations?: FoodTagTranslation[], languageCode = 'tr'): {
  id: number
  name: string
  slug: string
} {
  const currentTranslation = translations?.find(t => t.language_code === languageCode)
  const name = currentTranslation?.name || 'Ad Yok'
  
  return {
    id: tag.id,
    name,
    slug: tag.slug
  }
}

// Bulk recipe validation
export function validateBulkRecipeData(data: any, index: number): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: any
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Zorunlu alanlar
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push(`Tarif ${index}: title alanı zorunlu ve string olmalıdır`)
  }

  if (!data.instructions || !Array.isArray(data.instructions) || data.instructions.length === 0) {
    errors.push(`Tarif ${index}: instructions alanı zorunlu ve boş olmayan array olmalıdır`)
  }

  if (!data.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    errors.push(`Tarif ${index}: ingredients alanı zorunlu ve boş olmayan array olmalıdır`)
  }

  // Translations validation
  if (data.translations && typeof data.translations === 'object') {
    const supportedLanguages = ['tr', 'en', 'de', 'fr', 'es']
    
    Object.entries(data.translations).forEach(([lang, translation]: [string, any]) => {
      if (!supportedLanguages.includes(lang)) {
        warnings.push(`Tarif ${index}: "${lang}" dili desteklenmiyor, atlanacak`)
        return
      }
      
      if (typeof translation !== 'object') {
        warnings.push(`Tarif ${index}: "${lang}" çevirisi object olmalıdır`)
        return
      }
      
      // Translation içeriği kontrolü
      if (translation.title && typeof translation.title !== 'string') {
        warnings.push(`Tarif ${index}: "${lang}" çevirisinde title string olmalıdır`)
      }
      
      if (translation.description && typeof translation.description !== 'string') {
        warnings.push(`Tarif ${index}: "${lang}" çevirisinde description string olmalıdır`)
      }
      
      if (translation.instructions && (!Array.isArray(translation.instructions) || translation.instructions.length === 0)) {
        warnings.push(`Tarif ${index}: "${lang}" çevirisinde instructions array olmalıdır`)
      }
    })
  }

  // Ingredients validation
  if (data.ingredients && Array.isArray(data.ingredients)) {
    data.ingredients.forEach((ingredient: any, ingIndex: number) => {
      if (!ingredient.name || typeof ingredient.name !== 'string') {
        errors.push(`Tarif ${index}, Malzeme ${ingIndex + 1}: name alanı zorunlu ve string olmalıdır`)
      }
      if (!ingredient.quantity || typeof ingredient.quantity !== 'string') {
        errors.push(`Tarif ${index}, Malzeme ${ingIndex + 1}: quantity alanı zorunlu ve string olmalıdır`)
      }
      if (!ingredient.unit || typeof ingredient.unit !== 'string') {
        errors.push(`Tarif ${index}, Malzeme ${ingIndex + 1}: unit alanı zorunlu ve string olmalıdır`)
      }
    })
  }

  // Opsiyonel alanlar için uyarılar
  if (data.description && typeof data.description !== 'string') {
    warnings.push(`Tarif ${index}: description string olmalıdır`)
  }

  if (data.image_url && typeof data.image_url !== 'string') {
    warnings.push(`Tarif ${index}: image_url string olmalıdır`)
  }

  if (data.prep_time_minutes && typeof data.prep_time_minutes !== 'number') {
    warnings.push(`Tarif ${index}: prep_time_minutes number olmalıdır`)
  }

  if (data.cook_time_minutes && typeof data.cook_time_minutes !== 'number') {
    warnings.push(`Tarif ${index}: cook_time_minutes number olmalıdır`)
  }

  if (data.servings && typeof data.servings !== 'number') {
    warnings.push(`Tarif ${index}: servings number olmalıdır`)
  }

  if (data.difficulty && !['Easy', 'Medium', 'Hard'].includes(data.difficulty)) {
    warnings.push(`Tarif ${index}: difficulty "Easy", "Medium" veya "Hard" olmalıdır`)
  }

  if (data.cuisine && typeof data.cuisine !== 'string') {
    warnings.push(`Tarif ${index}: cuisine string olmalıdır`)
  }

  if (data.categories && !Array.isArray(data.categories)) {
    warnings.push(`Tarif ${index}: categories array olmalıdır`)
  }

  if (data.tags && !Array.isArray(data.tags)) {
    warnings.push(`Tarif ${index}: tags array olmalıdır`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : undefined
  }
}

// Duplicate recipe detection
export function detectDuplicateRecipes(
  newRecipes: any[], 
  existingRecipes: any[], 
  existingTranslations: Record<number, any[]>
): {
  duplicates: Array<{ index: number; reason: string; existingId?: number }>
  uniqueRecipes: any[]
} {
  const duplicates: Array<{ index: number; reason: string; existingId?: number }> = []
  const uniqueRecipes: any[] = []

  newRecipes.forEach((newRecipe, index) => {
    let isDuplicate = false
    let duplicateReason = ''
    let existingId: number | undefined

    // Mevcut tariflerle karşılaştır
    for (const existingRecipe of existingRecipes) {
      const existingRecipeTranslations = existingTranslations[existingRecipe.id] || []
      
      // Title ve instructions karşılaştırması
      const existingTranslation = existingRecipeTranslations.find(t => t.language_code === 'tr')
      
      if (existingTranslation) {
        // Title karşılaştırması (case-insensitive)
        if (existingTranslation.title?.toLowerCase().trim() === newRecipe.title?.toLowerCase().trim()) {
          isDuplicate = true
          duplicateReason = `Aynı başlık: "${existingTranslation.title}"`
          existingId = existingRecipe.id
          break
        }
        
        // Instructions karşılaştırması (eğer title farklıysa)
        if (newRecipe.instructions && existingTranslation.instructions) {
          const newInstructionsStr = newRecipe.instructions.join(' ').toLowerCase().trim()
          const existingInstructionsStr = existingTranslation.instructions.join(' ').toLowerCase().trim()
          
          if (newInstructionsStr === existingInstructionsStr && newInstructionsStr.length > 10) {
            isDuplicate = true
            duplicateReason = `Aynı tarif adımları: "${existingTranslation.title}"`
            existingId = existingRecipe.id
            break
          }
        }
      }
    }

    if (isDuplicate) {
      duplicates.push({ index, reason: duplicateReason, existingId })
    } else {
      uniqueRecipes.push(newRecipe)
    }
  })

  return { duplicates, uniqueRecipes }
}

// Bulk recipe data cleaning
export function cleanBulkRecipeData(data: any, languageCode: string): {
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: string;
  cuisine_id?: number;
  translations: Array<{
    language_code: string;
    title: string;
    description: string;
    instructions: string[];
  }>;
  // Junction table data
  categories?: string[];
  cuisines?: string[];
  tags?: string[];
  ingredients?: Array<{ name: string; quantity: string; unit: string }>;
} {
  // Ana recipe verisi (translations olmadan)
  const recipeData: any = {
    image_url: data.image_url || '',
    prep_time_minutes: data.prep_time_minutes || undefined,
    cook_time_minutes: data.cook_time_minutes || undefined,
    servings: data.servings || undefined,
    difficulty: (data.difficulty as RecipeDifficulty) || 'Medium',
    cuisine_id: undefined // TODO: cuisine slug'dan ID bul
  }

  // Çeviriler ayrı olarak
  const translations: Array<{
    language_code: string;
    title: string;
    description: string;
    instructions: string[];
  }> = []

  // Ana dil çevirisini ekle (fallback olarak)
  translations.push({
    language_code: languageCode,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    instructions: Array.isArray(data.instructions) ? data.instructions.map((i: string) => i.trim()) : []
  })

  // Eğer translations objesi varsa, desteklenen dilleri ekle
  if (data.translations && typeof data.translations === 'object') {
    const supportedLanguages = ['tr', 'en', 'de', 'fr', 'es']
    
    Object.entries(data.translations).forEach(([lang, translation]: [string, any]) => {
      if (supportedLanguages.includes(lang) && typeof translation === 'object') {
        // Ana dil zaten eklendi, tekrar ekleme
        if (lang === languageCode) return
        
        translations.push({
          language_code: lang,
          title: translation.title?.trim() || data.title.trim(),
          description: translation.description?.trim() || data.description?.trim() || '',
          instructions: Array.isArray(translation.instructions) 
            ? translation.instructions.map((i: string) => i.trim())
            : Array.isArray(data.instructions) 
              ? data.instructions.map((i: string) => i.trim())
              : []
        })
      }
    })
  }

  return {
    ...recipeData,
    translations,
    // Junction table data
    categories: data.categories || [],
    cuisines: data.cuisines || [],
    tags: data.tags || [],
    ingredients: data.ingredients || []
  }
}

// Junction table data oluştur
export function createJunctionTableData(
  recipeId: number,
  categories: string[],
  cuisines: string[],
  tags: string[],
  ingredients: Array<{ name: string; quantity: string; unit: string }>
): {
  recipeCategories: Array<{ recipe_id: number; category_id: number }>;
  recipeCuisines: Array<{ recipe_id: number; cuisine_id: number }>;
  recipeTags: Array<{ recipe_id: number; tag_id: number }>;
  recipeIngredients: Array<{ recipe_id: number; ingredient_id: number; quantity: string; unit: string }>;
} {
  return {
    recipeCategories: categories.map(category => ({ recipe_id: recipeId, category_id: 0 })), // TODO: category_id bul
    recipeCuisines: cuisines.map(cuisine => ({ recipe_id: recipeId, cuisine_id: 0 })), // TODO: cuisine_id bul
    recipeTags: tags.map(tag => ({ recipe_id: recipeId, tag_id: 0 })), // TODO: tag_id bul
    recipeIngredients: ingredients.map(ingredient => ({ 
      recipe_id: recipeId, 
      ingredient_id: 0, // TODO: ingredient_id bul
      quantity: ingredient.quantity, 
      unit: ingredient.unit 
    }))
  }
}

// =============================================
// PARSE VE EXPORT FONKSİYONLARI
// =============================================

// Çoklu tarif verilerini parse et
export function parseMultipleRecipesData(jsonString: string): Array<{
  recipe: Partial<CreateFoodRecipe>
  translations: Partial<FoodRecipeTranslation>[]
}> | null {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (!Array.isArray(parsed)) {
      throw new Error('Veri array formatında olmalı')
    }

    return parsed.map(item => ({
      recipe: item.recipe || {},
      translations: Array.isArray(item.translations) ? item.translations : []
    }))
  } catch (error) {
    console.error('JSON parse hatası:', error)
    return null
  }
}

// Çoklu malzeme verilerini parse et
export function parseMultipleIngredientsData(jsonString: string): Array<{
  ingredient: Partial<CreateFoodIngredient>
  translations: Partial<FoodIngredientTranslation>[]
}> | null {
  try {
    const parsed = JSON.parse(jsonString)
    
    if (!Array.isArray(parsed)) {
      throw new Error('Veri array formatında olmalı')
    }

    return parsed.map(item => ({
      ingredient: item.ingredient || {},
      translations: Array.isArray(item.translations) ? item.translations : []
    }))
  } catch (error) {
    console.error('JSON parse hatası:', error)
    return null
  }
}

// Tarifleri JSON formatında export et
export function exportRecipesToJson(recipes: FoodRecipe[]): string {
  const exportData = recipes.map(recipe => ({
    id: recipe.id,
    image_url: recipe.image_url,
    prep_time_minutes: recipe.prep_time_minutes,
    cook_time_minutes: recipe.cook_time_minutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    cuisine_id: recipe.cuisine_id,
    created_at: recipe.created_at
  }))

  return JSON.stringify(exportData, null, 2)
}

// Malzemeleri JSON formatında export et
export function exportIngredientsToJson(ingredients: FoodIngredient[]): string {
  const exportData = ingredients.map(ingredient => ({
    id: ingredient.id,
    source_id: ingredient.source_id,
    created_at: ingredient.created_at
  }))

  return JSON.stringify(exportData, null, 2)
}
