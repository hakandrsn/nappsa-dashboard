import { useCallback } from 'react'
import { supabase } from '@/api/supabase'
import type { Movie, MovieTranslation, PaginatedResponse, PaginationParams, CreateMovie, UpdateMovie } from '@/api/types'
import { useMovies } from '@/contexts/MoviesContext'

export function useMoviesApi() {
  const { state, dispatch } = useMovies()

  // Filmleri sayfalı olarak getir
  const fetchMovies = useCallback(async (params: PaginationParams, filters?: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      let query = supabase
        .from('movies')
        .select('*', { count: 'exact' })

      // Filtreleri uygula
      if (filters?.search) {
        query = query.or(`originaltitle.ilike.%${filters.search}%,imdb_id.ilike.%${filters.search}%`)
      }
      if (filters?.year) {
        query = query.eq('startyear', parseInt(filters.year))
      }
      if (filters?.rating) {
        query = query.gte('averagerating', parseFloat(filters.rating))
      }

      // Sayfalama
      const from = (params.page - 1) * params.limit
      const to = from + params.limit - 1
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error

      const response: PaginatedResponse<Movie> = {
        data: data || [],
        count: count || 0,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil((count || 0) / params.limit)
      }

      dispatch({ type: 'SET_MOVIES', payload: response })
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Filmler yüklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Film çevirilerini getir
  const fetchMovieTranslations = useCallback(async (movieId: number) => {
    try {
      const { data, error } = await supabase
        .from('movie_translations')
        .select('*')
        .eq('movie_id', movieId)

      if (error) throw error

      dispatch({ 
        type: 'SET_TRANSLATIONS', 
        payload: { movieId, translations: data || [] } 
      })

      return data
    } catch (error) {
      console.error('Film çevirileri yüklenirken hata:', error)
      throw error
    }
  }, [dispatch])

  // Tek film ekle
  const createMovie = useCallback(async (movieData: CreateMovie, translations: Omit<MovieTranslation, 'id' | 'movie_id' | 'created_at'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana film verisini ekle
      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .insert(movieData)
        .select()
        .single()

      if (movieError) throw movieError

      // Çevirileri ekle
      if (translations.length > 0) {
        const translationData = translations.map(t => ({
          ...t,
          movie_id: movie.id
        }))

        const { error: translationError } = await supabase
          .from('movie_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'ADD_MOVIE', payload: movie })
      return movie
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Film eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Çoklu film ekle
  const createMultipleMovies = useCallback(async (moviesData: Array<{
    movie: CreateMovie
    translations: Omit<MovieTranslation, 'id' | 'movie_id' | 'created_at'>[]
  }>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const createdMovies: Movie[] = []

      for (const { movie, translations } of moviesData) {
        // Ana film verisini ekle
        const { data: createdMovie, error: movieError } = await supabase
          .from('movies')
          .insert(movie)
          .select()
          .single()

        if (movieError) throw movieError

        // Çevirileri ekle
        if (translations.length > 0) {
          const translationData = translations.map(t => ({
            ...t,
            movie_id: createdMovie.id
          }))

          const { error: translationError } = await supabase
            .from('movie_translations')
            .insert(translationData)

          if (translationError) throw translationError
        }

        createdMovies.push(createdMovie)
      }

      // State'i güncelle
      createdMovies.forEach(movie => {
        dispatch({ type: 'ADD_MOVIE', payload: movie })
      })

      return createdMovies
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Filmler eklenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Film güncelle
  const updateMovie = useCallback(async (id: number, movieData: UpdateMovie, translations?: Omit<MovieTranslation, 'id' | 'movie_id' | 'created_at'>[]) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Ana film verisini güncelle
      const { data: movie, error: movieError } = await supabase
        .from('movies')
        .update(movieData)
        .eq('id', id)
        .select()
        .single()

      if (movieError) throw movieError

      // Çevirileri güncelle (varsa)
      if (translations && translations.length > 0) {
        // Mevcut çevirileri sil
        await supabase
          .from('movie_translations')
          .delete()
          .eq('movie_id', id)

        // Yeni çevirileri ekle
        const translationData = translations.map(t => ({
          ...t,
          movie_id: id
        }))

        const { error: translationError } = await supabase
          .from('movie_translations')
          .insert(translationData)

        if (translationError) throw translationError
      }

      dispatch({ type: 'UPDATE_MOVIE', payload: movie })
      return movie
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Film güncellenirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  // Film sil
  const deleteMovie = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Önce çevirileri sil
      const { error: translationError } = await supabase
        .from('movie_translations')
        .delete()
        .eq('movie_id', id)

      if (translationError) throw translationError

      // Ana filmi sil
      const { error: movieError } = await supabase
        .from('movies')
        .delete()
        .eq('id', id)

      if (movieError) throw movieError

      dispatch({ type: 'DELETE_MOVIE', payload: id })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Film silinirken hata oluştu'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [dispatch])

  return {
    fetchMovies,
    fetchMovieTranslations,
    createMovie,
    createMultipleMovies,
    updateMovie,
    deleteMovie,
    loading: state.loading,
    error: state.error
  }
}
