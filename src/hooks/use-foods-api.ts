import { useCallback } from 'react'
import { supabase } from '@/api/supabase'
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
  UpdateFoodRecipe,
  UpdateFoodIngredient,
  UpdateFoodCategory,
  UpdateFoodCuisine,
  UpdateFoodTag,
  PaginatedResponse, 
  PaginationParams 
} from '@/api/types'
import { useFoods } from '@/contexts/FoodsContext'
import { useLanguage } from '@/contexts/LanguageContext'

export function useFoodsApi() {
  const { state, dispatch } = useFoods()
  const { currentLanguage } = useLanguage()

  // =============================================
  // RECIPES (TARİFLER)
  // =============================================

  // Tarifleri getir (çevirilerle birlikte)
  const fetchRecipes = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('food_recipes')
        .select(`
          *,
          translations:food_recipe_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        // Tüm dillerdeki çevirilerde arama yap, sonrasında JS'de filtrele
        query = query.or(`translations.title.ilike.%${filters.search}%,translations.description.ilike.%${filters.search}%`)
      }
      if (filters?.category_id) {
        query = query.eq('category_id', parseInt(filters.category_id))
      }
      if (filters?.cuisine_id) {
        query = query.eq('cuisine_id', parseInt(filters.cuisine_id))
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const recipes = data || []
      const allTranslations: Record<number, FoodRecipeTranslation[]> = {}
      
      recipes.forEach(recipe => {
        if (recipe.translations) {
          allTranslations[recipe.id] = recipe.translations
          // Ana recipe objesinden translations'ı çıkar
          delete (recipe as any).translations
        }
      })

      const response: PaginatedResponse<FoodRecipe> = {
        data: recipes,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      // Eğer ilk sayfa ise mevcut verileri değiştir, değilse ekle
      if (params.page === 1) {
        dispatch({ type: 'SET_RECIPES', payload: response })
      } else {
        dispatch({ type: 'ADD_RECIPES', payload: response })
      }
      
      // Çevirileri ayrı olarak kaydet
      Object.entries(allTranslations).forEach(([recipeId, translations]) => {
        dispatch({ 
          type: 'SET_RECIPE_TRANSLATIONS', 
          payload: { recipeId: parseInt(recipeId), translations } 
        })
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tarifler yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, currentLanguage])

  // Tarif çevirilerini getir
  const fetchRecipeTranslations = useCallback(async (recipeId: number) => {
    try {
      const { data, error } = await supabase
        .from('food_recipe_translations')
        .select('*')
        .eq('recipe_id', recipeId)

      if (error) throw error

      dispatch({ 
        type: 'SET_RECIPE_TRANSLATIONS', 
        payload: { recipeId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Tarif çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Tarif ekle
  const createRecipe = useCallback(async (recipeData: CreateFoodRecipe, translations: Omit<FoodRecipeTranslation, 'id' | 'recipe_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana tarif verisini ekle
      const { data: recipe, error: recipeError } = await supabase
        .from('food_recipes')
        .insert(recipeData)
        .select()
        .single()

      if (recipeError) throw recipeError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          recipe_id: recipe.id
        }))

        const { error: translationError } = await supabase
          .from('food_recipe_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_RECIPE', payload: recipe })
      return recipe
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tarif eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Tarif güncelle
  const updateRecipe = useCallback(async (id: number, recipeData: UpdateFoodRecipe, translations?: Omit<FoodRecipeTranslation, 'id' | 'recipe_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana tarif verisini güncelle
      const { data: recipe, error: recipeError } = await supabase
        .from('food_recipes')
        .update(recipeData)
        .eq('id', id)
        .select()
        .single()

      if (recipeError) throw recipeError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('food_recipe_translations')
          .delete()
          .eq('recipe_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          recipe_id: id
        }))

        const { error: translationError } = await supabase
          .from('food_recipe_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_RECIPE', payload: recipe })
      return recipe
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tarif güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Tarif sil
  const deleteRecipe = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('food_recipe_translations')
        .delete()
        .eq('recipe_id', id)

      if (translationError) throw translationError

      // Ana tarifi sil
      const { error: recipeError } = await supabase
        .from('food_recipes')
        .delete()
        .eq('id', id)

      if (recipeError) throw recipeError

      dispatch({ type: 'DELETE_RECIPE', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tarif silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // INGREDIENTS (MALZEMELER)
  // =============================================

  // Malzemeleri getir (çevirilerle birlikte)
  const fetchIngredients = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('food_ingredients')
        .select(`
          *,
          translations:food_ingredient_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        // Tüm dillerdeki çevirilerde arama yap, sonrasında JS'de filtrele
        query = query.or(`translations.name.ilike.%${filters.search}%,translations.description.ilike.%${filters.search}%`)
      }
      if (filters?.category_id) {
        query = query.eq('category_id', parseInt(filters.category_id))
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const ingredients = data || []
      const allTranslations: Record<number, FoodIngredientTranslation[]> = {}
      
      ingredients.forEach(ingredient => {
        if (ingredient.translations) {
          allTranslations[ingredient.id] = ingredient.translations
          // Ana ingredient objesinden translations'ı çıkar
          delete (ingredient as any).translations
        }
      })

      const response: PaginatedResponse<FoodIngredient> = {
        data: ingredients,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      // Eğer ilk sayfa ise mevcut verileri değiştir, değilse ekle
      if (params.page === 1) {
        console.log('Setting ingredients (first page):', response.data.length)
        dispatch({ type: 'SET_INGREDIENTS', payload: response })
      } else {
        console.log('Adding ingredients (page', params.page, '):', response.data.length)
        dispatch({ type: 'ADD_INGREDIENTS', payload: response })
      }
      
      // Çevirileri ayrı olarak kaydet
      Object.entries(allTranslations).forEach(([ingredientId, translations]) => {
        dispatch({ 
          type: 'SET_INGREDIENT_TRANSLATIONS', 
          payload: { ingredientId: parseInt(ingredientId), translations } 
        })
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Malzemeler yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, currentLanguage])

  // Malzeme çevirilerini getir
  const fetchIngredientTranslations = useCallback(async (ingredientId: number) => {
    try {
      const { data, error } = await supabase
        .from('food_ingredient_translations')
        .select('*')
        .eq('ingredient_id', ingredientId)

      if (error) throw error

      dispatch({ 
        type: 'SET_INGREDIENT_TRANSLATIONS', 
        payload: { ingredientId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Malzeme çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Malzeme ekle
  const createIngredient = useCallback(async (ingredientData: CreateFoodIngredient, translations: Omit<FoodIngredientTranslation, 'id' | 'ingredient_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana malzeme verisini ekle
      const { data: ingredient, error: ingredientError } = await supabase
        .from('food_ingredients')
        .insert(ingredientData)
        .select()
        .single()

      if (ingredientError) throw ingredientError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          ingredient_id: ingredient.id
        }))

        const { error: translationError } = await supabase
          .from('food_ingredient_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_INGREDIENT', payload: ingredient })
      return ingredient
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Malzeme eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Malzeme güncelle
  const updateIngredient = useCallback(async (id: number, ingredientData: UpdateFoodIngredient, translations?: Omit<FoodIngredientTranslation, 'id' | 'ingredient_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana malzeme verisini güncelle
      const { data: ingredient, error: ingredientError } = await supabase
        .from('food_ingredients')
        .update(ingredientData)
        .eq('id', id)
        .select()
        .single()

      if (ingredientError) throw ingredientError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('food_ingredient_translations')
          .delete()
          .eq('ingredient_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          ingredient_id: id
        }))

        const { error: translationError } = await supabase
          .from('food_ingredient_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_INGREDIENT', payload: ingredient })
      return ingredient
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Malzeme güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Malzeme sil
  const deleteIngredient = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('food_ingredient_translations')
        .delete()
        .eq('ingredient_id', id)

      if (translationError) throw translationError

      // Ana malzemeyi sil
      const { error: ingredientError } = await supabase
        .from('food_ingredients')
        .delete()
        .eq('id', id)

      if (ingredientError) throw ingredientError

      dispatch({ type: 'DELETE_INGREDIENT', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Malzeme silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // CATEGORIES (KATEGORİLER)
  // =============================================

  // Kategorileri getir (çevirilerle birlikte)
  const fetchCategories = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('food_categories')
        .select(`
          *,
          translations:food_category_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`translations.name.ilike.%${filters.search}%`)
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const categories = data || []
      const allTranslations: Record<number, FoodCategoryTranslation[]> = {}
      
      categories.forEach(category => {
        if (category.translations) {
          allTranslations[category.id] = category.translations
          // Ana category objesinden translations'ı çıkar
          delete (category as any).translations
        }
      })

      const response: PaginatedResponse<FoodCategory> = {
        data: categories,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      dispatch({ type: 'SET_CATEGORIES', payload: response })
      
      // Çevirileri ayrı olarak kaydet
      Object.entries(allTranslations).forEach(([categoryId, translations]) => {
        dispatch({ 
          type: 'SET_CATEGORY_TRANSLATIONS', 
          payload: { categoryId: parseInt(categoryId), translations } 
        })
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kategoriler yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, currentLanguage])

  // Kategori çevirilerini getir
  const fetchCategoryTranslations = useCallback(async (categoryId: number) => {
    try {
      const { data, error } = await supabase
        .from('food_category_translations')
        .select('*')
        .eq('category_id', categoryId)

      if (error) throw error

      dispatch({ 
        type: 'SET_CATEGORY_TRANSLATIONS', 
        payload: { categoryId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Kategori çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Kategori ekle
  const createCategory = useCallback(async (categoryData: CreateFoodCategory, translations: Omit<FoodCategoryTranslation, 'id' | 'category_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana kategori verisini ekle
      const { data: category, error: categoryError } = await supabase
        .from('food_categories')
        .insert(categoryData)
        .select()
        .single()

      if (categoryError) throw categoryError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          category_id: category.id
        }))

        const { error: translationError } = await supabase
          .from('food_category_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_CATEGORY', payload: category })
      return category
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kategori eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Kategori güncelle
  const updateCategory = useCallback(async (id: number, categoryData: UpdateFoodCategory, translations?: Omit<FoodCategoryTranslation, 'id' | 'category_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana kategori verisini güncelle
      const { data: category, error: categoryError } = await supabase
        .from('food_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single()

      if (categoryError) throw categoryError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('food_category_translations')
          .delete()
          .eq('category_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          category_id: id
        }))

        const { error: translationError } = await supabase
          .from('food_category_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_CATEGORY', payload: category })
      return category
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kategori güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Kategori sil
  const deleteCategory = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('food_category_translations')
        .delete()
        .eq('category_id', id)

      if (translationError) throw translationError

      // Ana kategoriyi sil
      const { error: categoryError } = await supabase
        .from('food_categories')
        .delete()
        .eq('id', id)

      if (categoryError) throw categoryError

      dispatch({ type: 'DELETE_CATEGORY', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kategori silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // CUISINES (MUTFAKLAR)
  // =============================================

  // Mutfakları getir (çevirilerle birlikte)
  const fetchCuisines = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('food_cuisines')
        .select(`
          *,
          translations:food_cuisine_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`translations.name.ilike.%${filters.search}%`)
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const cuisines = data || []
      const allTranslations: Record<number, FoodCuisineTranslation[]> = {}
      
      cuisines.forEach(cuisine => {
        if (cuisine.translations) {
          allTranslations[cuisine.id] = cuisine.translations
          // Ana cuisine objesinden translations'ı çıkar
          delete (cuisine as any).translations
        }
      })

      const response: PaginatedResponse<FoodCuisine> = {
        data: cuisines,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      dispatch({ type: 'SET_CUISINES', payload: response })
      
      // Çevirileri ayrı olarak kaydet
      Object.entries(allTranslations).forEach(([cuisineId, translations]) => {
        dispatch({ 
          type: 'SET_CUISINE_TRANSLATIONS', 
          payload: { cuisineId: parseInt(cuisineId), translations } 
        })
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mutfaklar yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, currentLanguage])

  // Mutfak çevirilerini getir
  const fetchCuisineTranslations = useCallback(async (cuisineId: number) => {
    try {
      const { data, error } = await supabase
        .from('food_cuisine_translations')
        .select('*')
        .eq('cuisine_id', cuisineId)

      if (error) throw error

      dispatch({ 
        type: 'SET_CUISINE_TRANSLATIONS', 
        payload: { cuisineId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Mutfak çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Mutfak ekle
  const createCuisine = useCallback(async (cuisineData: CreateFoodCuisine, translations: Omit<FoodCuisineTranslation, 'id' | 'cuisine_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana mutfak verisini ekle
      const { data: cuisine, error: cuisineError } = await supabase
        .from('food_cuisines')
        .insert(cuisineData)
        .select()
        .single()

      if (cuisineError) throw cuisineError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          cuisine_id: cuisine.id
        }))

        const { error: translationError } = await supabase
          .from('food_cuisine_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_CUISINE', payload: cuisine })
      return cuisine
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mutfak eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Mutfak güncelle
  const updateCuisine = useCallback(async (id: number, cuisineData: UpdateFoodCuisine, translations?: Omit<FoodCuisineTranslation, 'id' | 'cuisine_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana mutfak verisini güncelle
      const { data: cuisine, error: cuisineError } = await supabase
        .from('food_cuisines')
        .update(cuisineData)
        .eq('id', id)
        .select()
        .single()

      if (cuisineError) throw cuisineError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('food_cuisine_translations')
          .delete()
          .eq('cuisine_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          cuisine_id: id
        }))

        const { error: translationError } = await supabase
          .from('food_cuisine_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_CUISINE', payload: cuisine })
      return cuisine
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mutfak güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Mutfak sil
  const deleteCuisine = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('food_cuisine_translations')
        .delete()
        .eq('cuisine_id', id)

      if (translationError) throw translationError

      // Ana mutfağı sil
      const { error: cuisineError } = await supabase
        .from('food_cuisines')
        .delete()
        .eq('id', id)

      if (cuisineError) throw cuisineError

      dispatch({ type: 'DELETE_CUISINE', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mutfak silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // TAGS (ETİKETLER)
  // =============================================

  // Etiketleri getir (çevirilerle birlikte)
  const fetchTags = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('food_tags')
        .select(`
          *,
          translations:food_tag_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`translations.name.ilike.%${filters.search}%`)
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const tags = data || []
      const allTranslations: Record<number, FoodTagTranslation[]> = {}
      
      tags.forEach(tag => {
        if (tag.translations) {
          allTranslations[tag.id] = tag.translations
          // Ana tag objesinden translations'ı çıkar
          delete (tag as any).translations
        }
      })

      const response: PaginatedResponse<FoodTag> = {
        data: tags,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      dispatch({ type: 'SET_TAGS', payload: response })
      
      // Çevirileri ayrı olarak kaydet
      Object.entries(allTranslations).forEach(([tagId, translations]) => {
        dispatch({ 
          type: 'SET_TAG_TRANSLATIONS', 
          payload: { tagId: parseInt(tagId), translations } 
        })
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Etiketler yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, currentLanguage])

  // Etiket çevirilerini getir
  const fetchTagTranslations = useCallback(async (tagId: number) => {
    try {
      const { data, error } = await supabase
        .from('food_tag_translations')
        .select('*')
        .eq('tag_id', tagId)

      if (error) throw error

      dispatch({ 
        type: 'SET_TAG_TRANSLATIONS', 
        payload: { tagId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Etiket çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Etiket ekle
  const createTag = useCallback(async (tagData: CreateFoodTag, translations: Omit<FoodTagTranslation, 'id' | 'tag_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana etiket verisini ekle
      const { data: tag, error: tagError } = await supabase
        .from('food_tags')
        .insert(tagData)
        .select()
        .single()

      if (tagError) throw tagError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          tag_id: tag.id
        }))

        const { error: translationError } = await supabase
          .from('food_tag_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_TAG', payload: tag })
      return tag
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Etiket eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Etiket güncelle
  const updateTag = useCallback(async (id: number, tagData: UpdateFoodTag, translations?: Omit<FoodTagTranslation, 'id' | 'tag_id'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana etiket verisini güncelle
      const { data: tag, error: tagError } = await supabase
        .from('food_tags')
        .update(tagData)
        .eq('id', id)
        .select()
        .single()

      if (tagError) throw tagError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('food_tag_translations')
          .delete()
          .eq('tag_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          tag_id: id
        }))

        const { error: translationError } = await supabase
          .from('food_tag_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_TAG', payload: tag })
      return tag
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Etiket güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Etiket sil
  const deleteTag = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('food_tag_translations')
        .delete()
        .eq('tag_id', id)

      if (translationError) throw translationError

      // Ana etiketi sil
      const { error: tagError } = await supabase
        .from('food_tags')
        .delete()
        .eq('id', id)

      if (tagError) throw tagError

      dispatch({ type: 'DELETE_TAG', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Etiket silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // JUNCTION TABLE FONKSİYONLARI
  // =============================================

  // Kategori adından ID bul
  const findCategoryIdByName = useCallback(async (categoryName: string): Promise<number | null> => {
    try {
      console.log(`🔍 Kategori aranıyor: "${categoryName}"`)
      
      // Önce çevirilerde arama yap
      const { data: translations, error: translationError } = await supabase
        .from('food_category_translations')
        .select('category_id, name')
        .ilike('name', `%${categoryName}%`)

      if (translationError) {
        console.warn(`❌ Kategori çevirisi bulunamadı: ${categoryName}`, translationError)
        return null
      }

      if (translations && translations.length > 0) {
        console.log(`✅ Kategori çeviride bulundu: ${categoryName} -> ID: ${translations[0].category_id}`)
        return translations[0].category_id
      }

      console.log(`⚠️ Çeviride bulunamadı, slug ile deneniyor: ${categoryName}`)

      // Eğer çeviride bulunamazsa, slug ile dene
      const { data: category, error: categoryError } = await supabase
        .from('food_categories')
        .select('id')
        .eq('slug', categoryName.toLowerCase().replace(/\s+/g, '-'))
        .single()

      if (categoryError) {
        console.warn(`❌ Kategori bulunamadı: ${categoryName}`, categoryError)
        return null
      }

      if (category?.id) {
        console.log(`✅ Kategori slug ile bulundu: ${categoryName} -> ID: ${category.id}`)
        return category.id
      }

      console.warn(`❌ Kategori hiçbir yöntemle bulunamadı: ${categoryName}`)
      return null
    } catch (error) {
      console.warn(`❌ Kategori arama hatası: ${categoryName}`, error)
      return null
    }
  }, [])

  // Tarif-kategori bağlantısı oluştur
  const createRecipeCategory = useCallback(async (recipeId: number, categoryId: number) => {
    try {
      const { error } = await supabase
        .from('food_recipe_categories')
        .insert({ recipe_id: recipeId, category_id: categoryId })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Tarif-kategori bağlantısı oluşturulamadı:', error)
      throw error
    }
  }, [])

  // Mutfak adından ID bul
  const findCuisineIdByName = useCallback(async (cuisineName: string): Promise<number | null> => {
    try {
      console.log(`🔍 Mutfak aranıyor: "${cuisineName}"`)
      
      // Önce çevirilerde arama yap
      const { data: translations, error: translationError } = await supabase
        .from('food_cuisine_translations')
        .select('cuisine_id, name')
        .ilike('name', `%${cuisineName}%`)

      if (translationError) {
        console.warn(`❌ Mutfak çevirisi bulunamadı: ${cuisineName}`, translationError)
        return null
      }

      if (translations && translations.length > 0) {
        console.log(`✅ Mutfak çeviride bulundu: ${cuisineName} -> ID: ${translations[0].cuisine_id}`)
        return translations[0].cuisine_id
      }

      console.log(`⚠️ Çeviride bulunamadı, slug ile deneniyor: ${cuisineName}`)

      // Eğer çeviride bulunamazsa, slug ile dene
      const { data: cuisine, error: cuisineError } = await supabase
        .from('food_cuisines')
        .select('id')
        .eq('slug', cuisineName.toLowerCase().replace(/\s+/g, '-'))
        .single()

      if (cuisineError) {
        console.warn(`❌ Mutfak bulunamadı: ${cuisineName}`, cuisineError)
        return null
      }

      if (cuisine?.id) {
        console.log(`✅ Mutfak slug ile bulundu: ${cuisineName} -> ID: ${cuisine.id}`)
        return cuisine.id
      }

      console.warn(`❌ Mutfak hiçbir yöntemle bulunamadı: ${cuisineName}`)
      return null
    } catch (error) {
      console.warn(`❌ Mutfak arama hatası: ${cuisineName}`, error)
      return null
    }
  }, [])

  // Tarif-mutfak bağlantısı oluştur
  const createRecipeCuisine = useCallback(async (recipeId: number, cuisineId: number) => {
    try {
      const { error } = await supabase
        .from('food_recipe_cuisines')
        .insert({ recipe_id: recipeId, cuisine_id: cuisineId })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Tarif-mutfak bağlantısı oluşturulamadı:', error)
      throw error
    }
  }, [])

  // Etiket adından ID bul (Devre dışı - sadece kategoriler kullanılıyor)
  const findTagIdByName = useCallback(async (tagName: string): Promise<number | null> => {
    console.log(`⚠️ Etiketler devre dışı: "${tagName}" - sadece kategoriler kullanılıyor`)
    return null
  }, [])

  // Tarif-etiket bağlantısı oluştur (Devre dışı - sadece kategoriler kullanılıyor)
  const createRecipeTag = useCallback(async (recipeId: number) => {
    console.log(`⚠️ Etiketler devre dışı: Recipe ${recipeId} - sadece kategoriler kullanılıyor`)
    return true
  }, [])

  // Malzeme adından ID bul
  const findIngredientIdByName = useCallback(async (ingredientName: string): Promise<number | null> => {
    try {
      console.log(`🔍 Malzeme aranıyor: "${ingredientName}"`)
      
      // Önce çevirilerde arama yap
      const { data: translations, error: translationError } = await supabase
        .from('food_ingredient_translations')
        .select('ingredient_id, name')
        .ilike('name', `%${ingredientName}%`)

      if (translationError) {
        console.warn(`❌ Malzeme çevirisi bulunamadı: ${ingredientName}`, translationError)
        return null
      }

      if (translations && translations.length > 0) {
        console.log(`✅ Malzeme çeviride bulundu: ${ingredientName} -> ID: ${translations[0].ingredient_id}`)
        return translations[0].ingredient_id
      }

      console.log(`⚠️ Çeviride bulunamadı, source_id ile deneniyor: ${ingredientName}`)

      // Eğer çeviride bulunamazsa, source_id ile dene
      const { data: ingredient, error: ingredientError } = await supabase
        .from('food_ingredients')
        .select('id')
        .eq('source_id', ingredientName.toLowerCase().replace(/\s+/g, '-'))
        .single()

      if (ingredientError) {
        console.warn(`❌ Malzeme bulunamadı: ${ingredientName}`, ingredientError)
        return null
      }

      if (ingredient?.id) {
        console.log(`✅ Malzeme source_id ile bulundu: ${ingredientName} -> ID: ${ingredient.id}`)
        return ingredient.id
      }

      console.warn(`❌ Malzeme hiçbir yöntemle bulunamadı: ${ingredientName}`)
      return null
    } catch (error) {
      console.warn(`❌ Malzeme arama hatası: ${ingredientName}`, error)
      return null
    }
  }, [])

  // Tarif-malzeme bağlantısı oluştur
  const createRecipeIngredient = useCallback(async (recipeId: number, ingredientId: number, quantity: string, unit: string) => {
    try {
      console.log(`🔗 Malzeme bağlantısı oluşturuluyor: Recipe ${recipeId}, Ingredient ${ingredientId}, Quantity ${quantity}, Unit ${unit}`)
      
      // Önce duplicate kontrolü yap
      const { data: existing } = await supabase
        .from('food_recipe_ingredients')
        .select('id')
        .eq('recipe_id', recipeId)
        .eq('ingredient_id', ingredientId)
        .single()

      if (existing) {
        console.log(`⚠️ Malzeme zaten mevcut: Recipe ${recipeId}, Ingredient ${ingredientId} - güncelleniyor`)
        
        // Mevcut kaydı güncelle
        const { error: updateError } = await supabase
          .from('food_recipe_ingredients')
          .update({ quantity, unit })
          .eq('recipe_id', recipeId)
          .eq('ingredient_id', ingredientId)

        if (updateError) throw updateError
        
        console.log(`✅ Malzeme güncellendi`)
        return true
      }

      // Yeni kayıt ekle
      const { error } = await supabase
        .from('food_recipe_ingredients')
        .insert({ 
          recipe_id: recipeId, 
          ingredient_id: ingredientId, 
          quantity, 
          unit 
        })

      if (error) throw error
      
      console.log(`✅ Malzeme bağlantısı oluşturuldu`)
      return true
    } catch (error) {
      console.error('❌ Tarif-malzeme bağlantısı oluşturulamadı:', error)
      throw error
    }
  }, [])

  // Junction table verilerini çekmek için yeni fonksiyonlar
  const fetchRecipeIngredients = useCallback(async (recipeId: number) => {
    try {
      console.log(`🔍 Tarif malzemeleri çekiliyor: Recipe ${recipeId}`)
      
      const { data, error } = await supabase
        .from('food_recipe_ingredients')
        .select(`
          ingredient_id,
          quantity,
          unit,
          notes
        `)
        .eq('recipe_id', recipeId)

      if (error) throw error
      
      console.log(`✅ Tarif malzemeleri çekildi: ${data?.length || 0} adet`)
      return data || []
    } catch (error) {
      console.error('❌ Tarif malzemeleri çekilemedi:', error)
      return []
    }
  }, [])

  const fetchRecipeCategories = useCallback(async (recipeId: number) => {
    try {
      console.log(`🔍 Tarif kategorileri çekiliyor: Recipe ${recipeId}`)
      
      const { data, error } = await supabase
        .from('food_recipe_categories')
        .select('category_id')
        .eq('recipe_id', recipeId)

      if (error) throw error
      
      console.log(`✅ Tarif kategorileri çekildi: ${data?.length || 0} adet`)
      return data || []
    } catch (error) {
      console.error('❌ Tarif kategorileri çekilemedi:', error)
      return []
    }
  }, [])

  const fetchRecipeCuisines = useCallback(async (recipeId: number) => {
    try {
      console.log(`🔍 Tarif mutfakları çekiliyor: Recipe ${recipeId}`)
      
      const { data, error } = await supabase
        .from('food_recipe_cuisines')
        .select('cuisine_id')
        .eq('recipe_id', recipeId)

      if (error) throw error
      
      console.log(`✅ Tarif mutfakları çekildi: ${data?.length || 0} adet`)
      return data || []
    } catch (error) {
      console.error('❌ Tarif mutfakları çekilemedi:', error)
      return []
    }
  }, [])

  return {
    // Recipes
    fetchRecipes,
    fetchRecipeTranslations,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    
    // Ingredients
    fetchIngredients,
    fetchIngredientTranslations,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    
    // Categories
    fetchCategories,
    fetchCategoryTranslations,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Cuisines
    fetchCuisines,
    fetchCuisineTranslations,
    createCuisine,
    updateCuisine,
    deleteCuisine,
    
    // Tags
    fetchTags,
    fetchTagTranslations,
    createTag,
    updateTag,
    deleteTag,
    
    // Common
    loading: state.loading,
    error: state.error,

    // Junction Table Functions
    findCategoryIdByName,
    createRecipeCategory,
    findCuisineIdByName,
    createRecipeCuisine,
    findTagIdByName,
    createRecipeTag,
    findIngredientIdByName,
    createRecipeIngredient,
    
    // Junction Table Fetch Functions
    fetchRecipeIngredients,
    fetchRecipeCategories,
    fetchRecipeCuisines
  }
}
