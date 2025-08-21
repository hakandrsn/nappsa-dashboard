import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FoodIngredient, FoodIngredientTranslation } from '@/api/types'
import supabase from '@/api/supabase'

interface UseIngredientsSearchProps {
  languageCode: string
  searchTerm: string
  page: number
  limit: number
}

interface SearchResult {
  ingredient: FoodIngredient
  translation: FoodIngredientTranslation | null
}

export function useIngredientsSearch({ languageCode, searchTerm, page, limit }: UseIngredientsSearchProps) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Search query function
  const searchIngredients = useCallback(async () => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      return { data: [], count: 0 }
    }

    console.log('🔍 Searching ingredients for:', debouncedSearchTerm)
    console.log('🌍 Language code:', languageCode)

    let query = supabase
      .from('food_ingredients')
      .select(`
        *,
        translations:food_ingredient_translations(*)
      `, { count: 'exact' })

    // Önce dil filtresi uygula
    query = query.eq('translations.language_code', languageCode)
    
    console.log('📊 Query without search filter, getting all ingredients for language:', languageCode)

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    console.log('📊 Query range:', { from, to, limit })

    const { data, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Search error:', error)
      throw error
    }

    console.log('📥 Raw data from Supabase:', data?.length || 0, 'items')

    // Client-side filtering
    const filteredResults = (data || []).filter((ingredient: any) => {
      const translation = ingredient.translations?.find((t: any) => t.language_code === languageCode)
      if (!translation) return false
      
      const searchLower = debouncedSearchTerm.toLowerCase()
      const nameMatch = translation.name?.toLowerCase().includes(searchLower)
      const descriptionMatch = translation.description?.toLowerCase().includes(searchLower)
      
      return nameMatch || descriptionMatch
    })

    console.log('🔍 Filtered results:', filteredResults.length, 'items')
    console.log('🔍 Search term:', debouncedSearchTerm)
    console.log('🔍 Found matches:', filteredResults.map((r: any) => {
      const t = r.translations?.find((t: any) => t.language_code === languageCode)
      return `${r.id}: ${t?.name || 'No name'}`
    }))

    // Process results
    const results: SearchResult[] = filteredResults.map(ingredient => {
      const translation = ingredient.translations?.find((t: any) => t.language_code === languageCode) || null
      return { ingredient, translation }
    })

    console.log('✅ Final search results:', results.length, 'items')

    return {
      data: results,
      count: results.length
    }
  }, [debouncedSearchTerm, languageCode, page, limit])

  // React Query with optimized caching - unified cache key system
  const {
    data: searchData,
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['ingredients', 'search', debouncedSearchTerm, languageCode, page, limit],
    queryFn: searchIngredients,
    enabled: Boolean(debouncedSearchTerm && debouncedSearchTerm.length >= 2),
    staleTime: 10 * 60 * 1000, // 10 minutes - daha uzun stale time
    gcTime: 30 * 60 * 1000, // 30 minutes - daha uzun cache time
    placeholderData: (previousData) => previousData,
    // Cache'de aynı key'leri birleştir
    structuralSharing: true
  })

  // Get all ingredients query (for non-search mode) - aynı cache key family
  const {
    data: allIngredientsData,
    isLoading: isLoadingAll,
    error: allIngredientsError,
    refetch: refetchAll
  } = useQuery({
    queryKey: ['ingredients', 'all', languageCode, page, limit],
    queryFn: async () => {
      console.log('📥 Fetching all ingredients, page:', page)

      let query = supabase
        .from('food_ingredients')
        .select(`
          *,
          translations:food_ingredient_translations(*)
        `, { count: 'exact' })

      // Filter by language
      query = query.eq('translations.language_code', languageCode)

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Fetch all ingredients error:', error)
        throw error
      }

      // Process results
      const results: SearchResult[] = (data || []).map(ingredient => {
        const translation = ingredient.translations?.find((t: any) => t.language_code === languageCode) || null
        return { ingredient, translation }
      })

      console.log('✅ All ingredients loaded:', results.length, 'items')

      return {
        data: results,
        count: results.length
      }
    },
    enabled: Boolean(!debouncedSearchTerm || debouncedSearchTerm.length < 2),
    staleTime: 10 * 60 * 1000, // 10 minutes - daha uzun stale time
    gcTime: 30 * 60 * 1000, // 30 minutes - daha uzun cache time
    placeholderData: (previousData) => previousData,
    // Cache'de aynı key'leri birleştir
    structuralSharing: true
  })

  // Return processed data
  const isSearchMode = debouncedSearchTerm && debouncedSearchTerm.length >= 2
  const currentData = isSearchMode ? searchData : allIngredientsData
  const isLoading = isSearchMode ? isSearching : isLoadingAll
  const error = isSearchMode ? searchError : allIngredientsError

  return {
    // Data
    data: currentData?.data || [],
    count: currentData?.count || 0,
    
    // State
    isSearchMode,
    isLoading,
    error,
    
    // Search info
    searchTerm: debouncedSearchTerm,
    
    // Actions
    refetch: isSearchMode ? refetchSearch : refetchAll,
    
    // Helper functions
    getIngredientName: (ingredientId: number) => {
      const result = currentData?.data?.find(r => r.ingredient.id === ingredientId)
      return result?.translation?.name || 'Ad Yok'
    }
  }
}
