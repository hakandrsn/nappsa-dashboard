import React, { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { 
  Activity, 
  ActivityCategory, 
  ActivityTranslation,
  ActivityCategoryTranslation,
  PaginatedResponse, 
  PaginationParams 
} from '@/api/types'

// State Types
interface ActivitiesState {
  // Ana veriler
  activities: Activity[]
  categories: ActivityCategory[]
  
  // Çeviriler
  activityTranslations: Record<number, ActivityTranslation[]>
  categoryTranslations: Record<number, ActivityCategoryTranslation[]>
  
  // Junction Tables
  activityCategories: Record<number, Array<{ category_id: number }>>
  
  // UI State
  loading: boolean
  error: string | null
  
  // Pagination
  activitiesPagination: PaginationParams
  categoriesPagination: PaginationParams
  
  // Counts
  activitiesCount: number
  categoriesCount: number
  
  // Filters
  activeFilters: {
    activities: ActivityFilters
    categories: ActivityCategoryFilters
  }
  
  // Active Tab
  activeTab: 'activities' | 'categories'
}

interface ActivityFilters {
  search: string
  category_id: string
  language: string
}

interface ActivityCategoryFilters {
  search: string
  parent_id: string
  language: string
}

// Action Types
type ActivitiesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: 'activities' | 'categories' }
  
  // Activities
  | { type: 'SET_ACTIVITIES'; payload: PaginatedResponse<Activity> }
  | { type: 'ADD_ACTIVITIES'; payload: PaginatedResponse<Activity> }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'DELETE_ACTIVITY'; payload: number }
  | { type: 'SET_ACTIVITY_TRANSLATIONS'; payload: { activityId: number; translations: ActivityTranslation[] } }
  
  // Categories
  | { type: 'SET_CATEGORIES'; payload: PaginatedResponse<ActivityCategory> }
  | { type: 'ADD_CATEGORIES'; payload: PaginatedResponse<ActivityCategory> }
  | { type: 'UPDATE_CATEGORY'; payload: ActivityCategory }
  | { type: 'DELETE_CATEGORY'; payload: number }
  | { type: 'SET_CATEGORY_TRANSLATIONS'; payload: { categoryId: number; translations: ActivityCategoryTranslation[] } }
  
  // Junction Tables
  | { type: 'SET_ACTIVITY_CATEGORIES'; payload: { activityId: number; categories: Array<{ category_id: number }> } }
  
  // Filters
  | { type: 'SET_ACTIVITY_FILTERS'; payload: Partial<ActivityFilters> }
  | { type: 'SET_CATEGORY_FILTERS'; payload: Partial<ActivityCategoryFilters> }
  | { type: 'RESET_ACTIVITY_FILTERS' }
  | { type: 'RESET_CATEGORY_FILTERS' }

// Initial State
const initialState: ActivitiesState = {
  // Ana veriler
  activities: [],
  categories: [],
  
  // Çeviriler
  activityTranslations: {},
  categoryTranslations: {},
  
  // Junction Tables
  activityCategories: {},
  
  // UI State
  loading: false,
  error: null,
  
  // Pagination
  activitiesPagination: { page: 1, limit: 50 },
  categoriesPagination: { page: 1, limit: 50 },
  
  // Counts
  activitiesCount: 0,
  categoriesCount: 0,
  
  // Filters
  activeFilters: {
    activities: {
      search: '',
      category_id: 'all',
      language: 'tr'
    },
    categories: {
      search: '',
      parent_id: 'all',
      language: 'tr'
    }
  },
  
  // Active Tab
  activeTab: 'activities'
}

// Reducer
function activitiesReducer(state: ActivitiesState, action: ActivitiesAction): ActivitiesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
      
    case 'SET_ERROR':
      return { ...state, error: action.payload }
      
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
      
    // Activities
    case 'SET_ACTIVITIES':
      return { 
        ...state, 
        activities: action.payload.data,
        activitiesCount: action.payload.count,
        activitiesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
      
    case 'ADD_ACTIVITIES':
      return { 
        ...state, 
        activities: [...state.activities, ...action.payload.data],
        activitiesCount: action.payload.count,
        activitiesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
      
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.map(activity => 
          activity.id === action.payload.id ? action.payload : activity
        )
      }
      
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        activities: state.activities.filter(activity => activity.id !== action.payload),
        activitiesCount: Math.max(0, state.activitiesCount - 1)
      }
      
    case 'SET_ACTIVITY_TRANSLATIONS':
      return {
        ...state,
        activityTranslations: {
          ...state.activityTranslations,
          [action.payload.activityId]: action.payload.translations
        }
      }
      
    // Categories
    case 'SET_CATEGORIES':
      return { 
        ...state, 
        categories: action.payload.data,
        categoriesCount: action.payload.count,
        categoriesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
      
    case 'ADD_CATEGORIES':
      return { 
        ...state, 
        categories: [...state.categories, ...action.payload.data],
        categoriesCount: action.payload.count,
        categoriesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
      
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category => 
          category.id === action.payload.id ? action.payload : category
        )
      }
      
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
        categoriesCount: Math.max(0, state.categoriesCount - 1)
      }
      
    case 'SET_CATEGORY_TRANSLATIONS':
      return {
        ...state,
        categoryTranslations: {
          ...state.categoryTranslations,
          [action.payload.categoryId]: action.payload.translations
        }
      }
      
    // Junction Tables
    case 'SET_ACTIVITY_CATEGORIES':
      return {
        ...state,
        activityCategories: {
          ...state.activityCategories,
          [action.payload.activityId]: action.payload.categories
        }
      }
      
    // Filters
    case 'SET_ACTIVITY_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          activities: { ...state.activeFilters.activities, ...action.payload }
        }
      }
      
    case 'SET_CATEGORY_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          categories: { ...state.activeFilters.categories, ...action.payload }
        }
      }
      
    case 'RESET_ACTIVITY_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          activities: {
            search: '',
            category_id: 'all',
            language: 'tr'
          }
        }
      }
      
    case 'RESET_CATEGORY_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          categories: {
            search: '',
            parent_id: 'all',
            language: 'tr'
          }
        }
      }
      
    default:
      return state
  }
}

// Context
interface ActivitiesContextType {
  state: ActivitiesState
  dispatch: React.Dispatch<ActivitiesAction>
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

// Provider
interface ActivitiesProviderProps {
  children: ReactNode
}

export function ActivitiesProvider({ children }: ActivitiesProviderProps) {
  const [state, dispatch] = useReducer(activitiesReducer, initialState)

  return (
    <ActivitiesContext.Provider value={{ state, dispatch }}>
      {children}
    </ActivitiesContext.Provider>
  )
}

// Hook
export function useActivities() {
  const context = useContext(ActivitiesContext)
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivitiesProvider')
  }
  return context
}
