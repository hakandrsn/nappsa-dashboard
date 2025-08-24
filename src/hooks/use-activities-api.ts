import { useCallback } from 'react'
import { supabase } from '@/api/supabase'
import type { 
  Activity, 
  ActivityCategory, 
  ActivityTranslation,
  ActivityCategoryTranslation,
  CreateActivity,
  CreateActivityCategory,
  UpdateActivity,
  UpdateActivityCategory,
  PaginatedResponse, 
  PaginationParams 
} from '@/api/types'
import { useActivities } from '@/contexts/ActivitiesContext'
import { useLanguage } from '@/contexts/LanguageContext'

export function useActivitiesApi() {
  const { state, dispatch } = useActivities()
  const { currentLanguage } = useLanguage()

  // =============================================
  // ACTIVITIES (AKTİVİTELER)
  // =============================================

  // Aktiviteleri getir (çevirilerle birlikte)
  const fetchActivities = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('activities')
        .select(`
          *,
          translations:activity_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`translations.title.ilike.%${filters.search}%,translations.description.ilike.%${filters.search}%`)
      }
      if (filters?.category_id) {
        const { data: linkedActivities } = await supabase
          .from('activity_category_links')
          .select('activity_id')
          .eq('category_id', parseInt(filters.category_id))
        
        if (linkedActivities && linkedActivities.length > 0) {
          const activityIds = linkedActivities.map(link => link.activity_id)
          query = query.in('id', activityIds)
        }
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Çevirileri ayrı olarak state'e kaydet
      const activities = data || []
      const allTranslations: Record<number, ActivityTranslation[]> = {}
      
      activities.forEach(activity => {
        if (activity.translations) {
          allTranslations[activity.id] = activity.translations
          // Ana activity objesinden translations'ı çıkar
          delete (activity as any).translations
        }
      })

      const response: PaginatedResponse<Activity> = {
        data: activities,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      // Eğer ilk sayfa ise mevcut verileri değiştir, değilse ekle
      if (params.page === 1) {
        dispatch({ type: 'SET_ACTIVITIES', payload: response })
      } else {
        dispatch({ type: 'ADD_ACTIVITIES', payload: response })
      }

      // Çevirileri state'e kaydet
      Object.entries(allTranslations).forEach(([activityId, translations]) => {
        dispatch({ 
          type: 'SET_ACTIVITY_TRANSLATIONS', 
          payload: { 
            activityId: parseInt(activityId), 
            translations 
          } 
        })
      })

      return response
    } catch (error) {
      console.error('Aktiviteler getirilirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Aktiviteler yüklenirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Aktivite oluştur
  const createActivity = useCallback(async (activityData: CreateActivity) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 1. Aktiviteyi oluştur
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .insert({})
        .select()
        .single()

      if (activityError) throw activityError

      // 2. Çevirileri ekle
      const translationsToInsert = activityData.translations.map(translation => ({
        activity_id: activity.id,
        language_code: translation.language_code,
        title: translation.title,
        description: translation.description
      }))

      const { error: translationsError } = await supabase
        .from('activity_translations')
        .insert(translationsToInsert)

      if (translationsError) throw translationsError

      // 3. Kategori bağlantılarını ekle
      if (activityData.category_ids.length > 0) {
        const categoryLinksToInsert = activityData.category_ids.map(categoryId => ({
          activity_id: activity.id,
          category_id: categoryId
        }))

        const { error: linksError } = await supabase
          .from('activity_category_links')
          .insert(categoryLinksToInsert)

        if (linksError) throw linksError
      }

      // 4. Yeni aktiviteyi state'e ekle
      dispatch({ type: 'UPDATE_ACTIVITY', payload: activity })

      return activity
    } catch (error) {
      console.error('Aktivite oluşturulurken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Aktivite oluşturulurken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Aktivite güncelle
  const updateActivity = useCallback(async (id: number, activityData: UpdateActivity) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 1. Çevirileri güncelle
      if (activityData.translations) {
        for (const translation of activityData.translations) {
          const { error: translationError } = await supabase
            .from('activity_translations')
            .upsert({
              activity_id: id,
              language_code: translation.language_code,
              title: translation.title,
              description: translation.description
            })

          if (translationError) throw translationError
        }
      }

      // 2. Kategori bağlantılarını güncelle
      if (activityData.category_ids) {
        // Mevcut bağlantıları sil
        const { error: deleteError } = await supabase
          .from('activity_category_links')
          .delete()
          .eq('activity_id', id)

        if (deleteError) throw deleteError

        // Yeni bağlantıları ekle
        if (activityData.category_ids.length > 0) {
          const categoryLinksToInsert = activityData.category_ids.map(categoryId => ({
            activity_id: id,
            category_id: categoryId
          }))

          const { error: insertError } = await supabase
            .from('activity_category_links')
            .insert(categoryLinksToInsert)

          if (insertError) throw insertError
        }
      }

      // 3. State'i güncelle
      const updatedActivity = { ...state.activities.find(a => a.id === id)!, id }
      dispatch({ type: 'UPDATE_ACTIVITY', payload: updatedActivity })

      return updatedActivity
    } catch (error) {
      console.error('Aktivite güncellenirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Aktivite güncellenirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, state.activities])

  // Aktivite sil
  const deleteActivity = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)

      if (error) throw error

      // State'den kaldır
      dispatch({ type: 'DELETE_ACTIVITY', payload: id })

      return true
    } catch (error) {
      console.error('Aktivite silinirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Aktivite silinirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // CATEGORIES (KATEGORİLER)
  // =============================================

  // Kategorileri getir
  const fetchCategories = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('activity_categories')
        .select(`
          *,
          translations:activity_category_translations(*)
        `, { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`translations.name.ilike.%${filters.search}%`)
      }
      if (filters?.parent_id) {
        if (filters.parent_id === 'null') {
          query = query.is('parent_id', null)
        } else {
          query = query.eq('parent_id', parseInt(filters.parent_id))
        }
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
      const allTranslations: Record<number, ActivityCategoryTranslation[]> = {}
      
      categories.forEach(category => {
        if (category.translations) {
          allTranslations[category.id] = category.translations
          // Ana category objesinden translations'ı çıkar
          delete (category as any).translations
        }
      })

      const response: PaginatedResponse<ActivityCategory> = {
        data: categories,
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      // Eğer ilk sayfa ise mevcut verileri değiştir, değilse ekle
      if (params.page === 1) {
        dispatch({ type: 'SET_CATEGORIES', payload: response })
      } else {
        dispatch({ type: 'ADD_CATEGORIES', payload: response })
      }

      // Çevirileri state'e kaydet
      Object.entries(allTranslations).forEach(([categoryId, translations]) => {
        dispatch({ 
          type: 'SET_CATEGORY_TRANSLATIONS', 
          payload: { 
            categoryId: parseInt(categoryId), 
            translations 
          } 
        })
      })

      return response
    } catch (error) {
      console.error('Kategoriler getirilirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Kategoriler yüklenirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Kategori oluştur
  const createCategory = useCallback(async (categoryData: CreateActivityCategory) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 1. Kategoriyi oluştur
      const { data: category, error: categoryError } = await supabase
        .from('activity_categories')
        .insert({
          parent_id: categoryData.parent_id || null,
          slug: categoryData.slug
        })
        .select()
        .single()

      if (categoryError) throw categoryError

      // 2. Çevirileri ekle
      const translationsToInsert = categoryData.translations.map(translation => ({
        category_id: category.id,
        language_code: translation.language_code,
        name: translation.name
      }))

      const { error: translationsError } = await supabase
        .from('activity_category_translations')
        .insert(translationsToInsert)

      if (translationsError) throw translationsError

      // 3. Yeni kategoriyi state'e ekle
      dispatch({ type: 'UPDATE_CATEGORY', payload: category })

      return category
    } catch (error) {
      console.error('Kategori oluşturulurken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Kategori oluşturulurken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Kategori güncelle
  const updateCategory = useCallback(async (id: number, categoryData: UpdateActivityCategory) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // 1. Ana kategori bilgilerini güncelle
      if (categoryData.parent_id !== undefined || categoryData.slug) {
        const updateData: any = {}
        if (categoryData.parent_id !== undefined) updateData.parent_id = categoryData.parent_id
        if (categoryData.slug) updateData.slug = categoryData.slug

        const { error: categoryError } = await supabase
          .from('activity_categories')
          .update(updateData)
          .eq('id', id)

        if (categoryError) throw categoryError
      }

      // 2. Çevirileri güncelle
      if (categoryData.translations) {
        for (const translation of categoryData.translations) {
          const { error: translationError } = await supabase
            .from('activity_category_translations')
            .upsert({
              category_id: id,
              language_code: translation.language_code,
              name: translation.name
            })

          if (translationError) throw translationError
        }
      }

      // 3. State'i güncelle
      const updatedCategory = { ...state.categories.find(c => c.id === id)!, id }
      if (categoryData.parent_id !== undefined) updatedCategory.parent_id = categoryData.parent_id
      if (categoryData.slug) updatedCategory.slug = categoryData.slug

      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory })

      return updatedCategory
    } catch (error) {
      console.error('Kategori güncellenirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Kategori güncellenirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch, state.categories])

  // Kategori sil
  const deleteCategory = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const { error } = await supabase
        .from('activity_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      // State'den kaldır
      dispatch({ type: 'DELETE_CATEGORY', payload: id })

      return true
    } catch (error) {
      console.error('Kategori silinirken hata:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Kategori silinirken hata oluştu' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  // Mevcut dildeki çeviriyi getir
  const getTranslation = useCallback((translations: any[], field: string) => {
    const translation = translations?.find(t => t.language_code === currentLanguage)
    return translation?.[field] || ''
  }, [currentLanguage])

  // Filtreleri güncelle
  const updateActivityFilters = useCallback((filters: Partial<any>) => {
    dispatch({ type: 'SET_ACTIVITY_FILTERS', payload: filters })
  }, [dispatch])

  const updateCategoryFilters = useCallback((filters: Partial<any>) => {
    dispatch({ type: 'SET_CATEGORY_FILTERS', payload: filters })
  }, [dispatch])

  // Filtreleri sıfırla
  const resetActivityFilters = useCallback(() => {
    dispatch({ type: 'RESET_ACTIVITY_FILTERS' })
  }, [dispatch])

  const resetCategoryFilters = useCallback(() => {
    dispatch({ type: 'RESET_CATEGORY_FILTERS' })
  }, [dispatch])

  return {
    // State
    state,
    
    // Activities
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    
    // Categories
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Utilities
    getTranslation,
    updateActivityFilters,
    updateCategoryFilters,
    resetActivityFilters,
    resetCategoryFilters,
    
    // Loading
    loading: state.loading
  }
}
