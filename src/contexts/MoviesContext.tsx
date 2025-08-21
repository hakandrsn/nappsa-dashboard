import React, { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { Movie, MovieTranslation, PaginatedResponse, PaginationParams } from '@/api/types'

// State Types
interface MoviesState {
  movies: Movie[]
  translations: Record<number, MovieTranslation[]>
  loading: boolean
  error: string | null
  pagination: PaginationParams
  totalCount: number
  filters: MovieFilters
}

interface MovieFilters {
  search: string
  year: string
  rating: string
  language: string
}

// Action Types
type MoviesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MOVIES'; payload: PaginatedResponse<Movie> }
  | { type: 'SET_TRANSLATIONS'; payload: { movieId: number; translations: MovieTranslation[] } }
  | { type: 'SET_FILTERS'; payload: Partial<MovieFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'ADD_MOVIE'; payload: Movie }
  | { type: 'UPDATE_MOVIE'; payload: Movie }
  | { type: 'DELETE_MOVIE'; payload: number }

// Initial State
const initialState: MoviesState = {
  movies: [],
  translations: {},
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20 },
  totalCount: 0,
  filters: {
    search: '',
    year: '',
    rating: '',
    language: 'tr'
  }
}

// Reducer
function moviesReducer(state: MoviesState, action: MoviesAction): MoviesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_MOVIES':
      return {
        ...state,
        movies: action.payload.data,
        totalCount: action.payload.count,
        pagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'SET_TRANSLATIONS':
      return {
        ...state,
        translations: {
          ...state.translations,
          [action.payload.movieId]: action.payload.translations
        }
      }
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
      }
    
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        pagination: { ...state.pagination, page: 1 }
      }
    
    case 'ADD_MOVIE':
      return {
        ...state,
        movies: [action.payload, ...state.movies],
        totalCount: state.totalCount + 1
      }
    
    case 'UPDATE_MOVIE':
      return {
        ...state,
        movies: state.movies.map(movie => 
          movie.id === action.payload.id ? action.payload : movie
        )
      }
    
    case 'DELETE_MOVIE':
      return {
        ...state,
        movies: state.movies.filter(movie => movie.id !== action.payload),
        totalCount: state.totalCount - 1
      }
    
    default:
      return state
  }
}

// Context
interface MoviesContextType {
  state: MoviesState
  dispatch: React.Dispatch<MoviesAction>
}

const MoviesContext = createContext<MoviesContextType | undefined>(undefined)

// Provider
interface MoviesProviderProps {
  children: ReactNode
}

export function MoviesProvider({ children }: MoviesProviderProps) {
  const [state, dispatch] = useReducer(moviesReducer, initialState)

  return (
    <MoviesContext.Provider value={{ state, dispatch }}>
      {children}
    </MoviesContext.Provider>
  )
}

// Hook
export function useMovies() {
  const context = useContext(MoviesContext)
  if (context === undefined) {
    throw new Error('useMovies must be used within a MoviesProvider')
  }
  return context
}
