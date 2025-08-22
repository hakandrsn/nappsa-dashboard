import React, { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
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
  PaginatedResponse, 
  PaginationParams 
} from '@/api/types'

// State Types
interface FoodsState {
  // Ana veriler
  recipes: FoodRecipe[]
  ingredients: FoodIngredient[]
  categories: FoodCategory[]
  cuisines: FoodCuisine[]
  tags: FoodTag[]
  
  // Çeviriler
  recipeTranslations: Record<number, FoodRecipeTranslation[]>
  ingredientTranslations: Record<number, FoodIngredientTranslation[]>
  categoryTranslations: Record<number, FoodCategoryTranslation[]>
  cuisineTranslations: Record<number, FoodCuisineTranslation[]>
  tagTranslations: Record<number, FoodTagTranslation[]>
  
  // Junction Tables
  recipeIngredients: Record<number, Array<{ ingredient_id: number; quantity: string; unit: string }>>
  recipeCategories: Record<number, Array<{ category_id: number }>>
  recipeTags: Record<number, Array<{ tag_id: number }>>
  recipeCuisines: Record<number, Array<{ cuisine_id: number }>>
  
  // UI State
  loading: boolean
  error: string | null
  
  // Pagination
  recipesPagination: PaginationParams
  ingredientsPagination: PaginationParams
  categoriesPagination: PaginationParams
  cuisinesPagination: PaginationParams
  tagsPagination: PaginationParams
  
  // Counts
  recipesCount: number
  ingredientsCount: number
  categoriesCount: number
  cuisinesCount: number
  tagsCount: number
  
  // Filters
  activeFilters: {
    recipes: RecipeFilters
    ingredients: IngredientFilters
    categories: CategoryFilters
    cuisines: CuisineFilters
    tags: TagFilters
  }
  
  // Active Tab
  activeTab: 'recipes' | 'ingredients' | 'categories' | 'cuisines' | 'tags'
}

interface RecipeFilters {
  search: string
  category_id: string
  cuisine_id: string
  difficulty: string
  language: string
}

interface IngredientFilters {
  search: string
  category_id: string
  language: string
}

interface CategoryFilters {
  search: string
  language: string
}

interface CuisineFilters {
  search: string
  language: string
}

interface TagFilters {
  search: string
  language: string
}

// Action Types
type FoodsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: FoodsState['activeTab'] }
  
  // Recipes
  | { type: 'SET_RECIPES'; payload: PaginatedResponse<FoodRecipe> }
  | { type: 'ADD_RECIPES'; payload: PaginatedResponse<FoodRecipe> }
  | { type: 'SET_RECIPE_TRANSLATIONS'; payload: { recipeId: number; translations: FoodRecipeTranslation[] } }
  | { type: 'ADD_RECIPE'; payload: FoodRecipe }
  | { type: 'UPDATE_RECIPE'; payload: FoodRecipe }
  | { type: 'DELETE_RECIPE'; payload: number }
  | { type: 'SET_RECIPE_FILTERS'; payload: Partial<RecipeFilters> }
  | { type: 'ADD_RECIPE_CATEGORY'; payload: { recipeId: number; categoryId: number } }
  | { type: 'ADD_RECIPE_CUISINE'; payload: { recipeId: number; cuisineId: number } }
  | { type: 'SET_RECIPE_INGREDIENTS'; payload: { recipeId: number; ingredients: Array<{ ingredient_id: number; quantity: string; unit: string }> } }
  | { type: 'SET_RECIPE_CATEGORIES'; payload: { recipeId: number; categories: Array<{ category_id: number }> } }
  | { type: 'SET_RECIPE_TAGS'; payload: { recipeId: number; tags: Array<{ tag_id: number }> } }
  | { type: 'SET_RECIPE_CUISINES'; payload: { recipeId: number; cuisines: Array<{ cuisine_id: number }> } }
  
  // Ingredients
  | { type: 'SET_INGREDIENTS'; payload: PaginatedResponse<FoodIngredient> }
  | { type: 'ADD_INGREDIENTS'; payload: PaginatedResponse<FoodIngredient> }
  | { type: 'SET_INGREDIENT_TRANSLATIONS'; payload: { ingredientId: number; translations: FoodIngredientTranslation[] } }
  | { type: 'ADD_INGREDIENT'; payload: FoodIngredient }
  | { type: 'UPDATE_INGREDIENT'; payload: FoodIngredient }
  | { type: 'DELETE_INGREDIENT'; payload: number }
  | { type: 'SET_INGREDIENT_FILTERS'; payload: Partial<IngredientFilters> }
  
  // Categories
  | { type: 'SET_CATEGORIES'; payload: PaginatedResponse<FoodCategory> }
  | { type: 'SET_CATEGORY_TRANSLATIONS'; payload: { categoryId: number; translations: FoodCategoryTranslation[] } }
  | { type: 'ADD_CATEGORY'; payload: FoodCategory }
  | { type: 'UPDATE_CATEGORY'; payload: FoodCategory }
  | { type: 'DELETE_CATEGORY'; payload: number }
  | { type: 'SET_CATEGORY_FILTERS'; payload: Partial<CategoryFilters> }
  
  // Cuisines
  | { type: 'SET_CUISINES'; payload: PaginatedResponse<FoodCuisine> }
  | { type: 'SET_CUISINE_TRANSLATIONS'; payload: { cuisineId: number; translations: FoodCuisineTranslation[] } }
  | { type: 'ADD_CUISINE'; payload: FoodCuisine }
  | { type: 'UPDATE_CUISINE'; payload: FoodCuisine }
  | { type: 'DELETE_CUISINE'; payload: number }
  | { type: 'SET_CUISINE_FILTERS'; payload: Partial<CuisineFilters> }
  
  // Tags
  | { type: 'SET_TAGS'; payload: PaginatedResponse<FoodTag> }
  | { type: 'SET_TAG_TRANSLATIONS'; payload: { tagId: number; translations: FoodTagTranslation[] } }
  | { type: 'ADD_TAG'; payload: FoodTag }
  | { type: 'UPDATE_TAG'; payload: FoodTag }
  | { type: 'DELETE_TAG'; payload: number }
  | { type: 'SET_TAG_FILTERS'; payload: Partial<TagFilters> }
  
  // Utility Actions
  | { type: 'CLEAR_ALL_TRANSLATIONS' }

// Initial State
const initialState: FoodsState = {
  // Ana veriler
  recipes: [],
  ingredients: [],
  categories: [],
  cuisines: [],
  tags: [],
  
  // Çeviriler
  recipeTranslations: {},
  ingredientTranslations: {},
  categoryTranslations: {},
  cuisineTranslations: {},
  tagTranslations: {},
  
  // Junction Tables
  recipeIngredients: {},
  recipeCategories: {},
  recipeTags: {},
  recipeCuisines: {},
  
  // UI State
  loading: false,
  error: null,
  
  // Pagination
  recipesPagination: { page: 1, limit: 20 },
  ingredientsPagination: { page: 1, limit: 20 },
  categoriesPagination: { page: 1, limit: 20 },
  cuisinesPagination: { page: 1, limit: 20 },
  tagsPagination: { page: 1, limit: 20 },
  
  // Counts
  recipesCount: 0,
  ingredientsCount: 0,
  categoriesCount: 0,
  cuisinesCount: 0,
  tagsCount: 0,
  
  // Filters
  activeFilters: {
    recipes: {
      search: '',
      category_id: '',
      cuisine_id: '',
      difficulty: '',
      language: 'tr'
    },
    ingredients: {
      search: '',
      category_id: '',
      language: 'tr'
    },
    categories: {
      search: '',
      language: 'tr'
    },
    cuisines: {
      search: '',
      language: 'tr'
    },
    tags: {
      search: '',
      language: 'tr'
    }
  },
  
  // Active Tab
  activeTab: 'recipes'
}

// Reducer
function foodsReducer(state: FoodsState, action: FoodsAction): FoodsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    
    // Recipes
    case 'SET_RECIPES':
      return {
        ...state,
        recipes: action.payload.data,
        recipesCount: action.payload.count,
        recipesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'ADD_RECIPES':
      return {
        ...state,
        recipes: [...state.recipes, ...action.payload.data],
        recipesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'SET_RECIPE_TRANSLATIONS':
      return {
        ...state,
        recipeTranslations: {
          ...state.recipeTranslations,
          [action.payload.recipeId]: action.payload.translations
        }
      }
    
    case 'ADD_RECIPE':
      return {
        ...state,
        recipes: [action.payload, ...state.recipes],
        recipesCount: state.recipesCount + 1
      }
    
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe => 
          recipe.id === action.payload.id ? action.payload : recipe
        )
      }
    
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload),
        recipesCount: state.recipesCount - 1
      }
    
    case 'SET_RECIPE_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          recipes: { ...state.activeFilters.recipes, ...action.payload }
        },
        recipesPagination: { ...state.recipesPagination, page: 1 }
      }
    
    case 'ADD_RECIPE_CATEGORY':
      return {
        ...state,
        recipeCategories: {
          ...state.recipeCategories,
          [action.payload.recipeId]: [...(state.recipeCategories[action.payload.recipeId] || []), { category_id: action.payload.categoryId }]
        }
      }
    
    case 'ADD_RECIPE_CUISINE':
      return {
        ...state,
        recipeCuisines: {
          ...state.recipeCuisines,
          [action.payload.recipeId]: [...(state.recipeCuisines[action.payload.recipeId] || []), { cuisine_id: action.payload.cuisineId }]
        }
      }
    
    case 'SET_RECIPE_INGREDIENTS':
      return {
        ...state,
        recipeIngredients: {
          ...state.recipeIngredients,
          [action.payload.recipeId]: action.payload.ingredients
        }
      }
    
    case 'SET_RECIPE_CATEGORIES':
      return {
        ...state,
        recipeCategories: {
          ...state.recipeCategories,
          [action.payload.recipeId]: action.payload.categories
        }
      }
    
    case 'SET_RECIPE_TAGS':
      return {
        ...state,
        recipeTags: {
          ...state.recipeTags,
          [action.payload.recipeId]: action.payload.tags
        }
      }
    
    case 'SET_RECIPE_CUISINES':
      return {
        ...state,
        recipeCuisines: {
          ...state.recipeCuisines,
          [action.payload.recipeId]: action.payload.cuisines
        }
      }
    
    // Ingredients
    case 'SET_INGREDIENTS':
      return {
        ...state,
        ingredients: action.payload.data,
        ingredientsCount: action.payload.count,
        ingredientsPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'ADD_INGREDIENTS':
      console.log('ADD_INGREDIENTS reducer called')
      console.log('Current ingredients count:', state.ingredients.length)
      console.log('New ingredients count:', action.payload.data.length)
      console.log('Total after merge:', state.ingredients.length + action.payload.data.length)
      
      const newIngredients = [...state.ingredients, ...action.payload.data]
      console.log('New ingredients array length:', newIngredients.length)
      
      return {
        ...state,
        ingredients: newIngredients,
        ingredientsPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'SET_INGREDIENT_TRANSLATIONS':
      return {
        ...state,
        ingredientTranslations: {
          ...state.ingredientTranslations,
          [action.payload.ingredientId]: action.payload.translations
        }
      }
    
    case 'ADD_INGREDIENT':
      return {
        ...state,
        ingredients: [action.payload, ...state.ingredients],
        ingredientsCount: state.ingredientsCount + 1
      }
    
    case 'UPDATE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.map(ingredient => 
          ingredient.id === action.payload.id ? action.payload : ingredient
        )
      }
    
    case 'DELETE_INGREDIENT':
      return {
        ...state,
        ingredients: state.ingredients.filter(ingredient => ingredient.id !== action.payload),
        ingredientsCount: state.ingredientsCount - 1
      }
    
    case 'SET_INGREDIENT_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          ingredients: { ...state.activeFilters.ingredients, ...action.payload }
        },
        ingredientsPagination: { ...state.ingredientsPagination, page: 1 }
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
    
    case 'SET_CATEGORY_TRANSLATIONS':
      return {
        ...state,
        categoryTranslations: {
          ...state.categoryTranslations,
          [action.payload.categoryId]: action.payload.translations
        }
      }
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [action.payload, ...state.categories],
        categoriesCount: state.categoriesCount + 1
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
        categoriesCount: state.categoriesCount - 1
      }
    
    case 'SET_CATEGORY_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          categories: { ...state.activeFilters.categories, ...action.payload }
        },
        categoriesPagination: { ...state.categoriesPagination, page: 1 }
      }
    
    // Cuisines
    case 'SET_CUISINES':
      return {
        ...state,
        cuisines: action.payload.data,
        cuisinesCount: action.payload.count,
        cuisinesPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'SET_CUISINE_TRANSLATIONS':
      return {
        ...state,
        cuisineTranslations: {
          ...state.cuisineTranslations,
          [action.payload.cuisineId]: action.payload.translations
        }
      }
    
    case 'ADD_CUISINE':
      return {
        ...state,
        cuisines: [action.payload, ...state.cuisines],
        cuisinesCount: state.cuisinesCount + 1
      }
    
    case 'UPDATE_CUISINE':
      return {
        ...state,
        cuisines: state.cuisines.map(cuisine => 
          cuisine.id === action.payload.id ? action.payload : cuisine
        )
      }
    
    case 'DELETE_CUISINE':
      return {
        ...state,
        cuisines: state.cuisines.filter(cuisine => cuisine.id !== action.payload),
        cuisinesCount: state.cuisinesCount - 1
      }
    
    case 'SET_CUISINE_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          cuisines: { ...state.activeFilters.cuisines, ...action.payload }
        },
        cuisinesPagination: { ...state.cuisinesPagination, page: 1 }
      }
    
    // Tags
    case 'SET_TAGS':
      return {
        ...state,
        tags: action.payload.data,
        tagsCount: action.payload.count,
        tagsPagination: {
          page: action.payload.page,
          limit: action.payload.limit
        }
      }
    
    case 'SET_TAG_TRANSLATIONS':
      return {
        ...state,
        tagTranslations: {
          ...state.tagTranslations,
          [action.payload.tagId]: action.payload.translations
        }
      }
    
    case 'ADD_TAG':
      return {
        ...state,
        tags: [action.payload, ...state.tags],
        tagsCount: state.tagsCount + 1
      }
    
    case 'UPDATE_TAG':
      return {
        ...state,
        tags: state.tags.map(tag => 
          tag.id === action.payload.id ? action.payload : tag
        )
      }
    
    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter(tag => tag.id !== action.payload),
        tagsCount: state.tagsCount - 1
      }
    
    case 'SET_TAG_FILTERS':
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          tags: { ...state.activeFilters.tags, ...action.payload }
        },
        tagsPagination: { ...state.tagsPagination, page: 1 }
      }
    
    case 'CLEAR_ALL_TRANSLATIONS':
      return {
        ...state,
        recipeTranslations: {},
        ingredientTranslations: {},
        categoryTranslations: {},
        cuisineTranslations: {},
        tagTranslations: {}
      }
    
    default:
      return state
  }
}

// Context
interface FoodsContextType {
  state: FoodsState
  dispatch: React.Dispatch<FoodsAction>
}

const FoodsContext = createContext<FoodsContextType | undefined>(undefined)

// Provider
interface FoodsProviderProps {
  children: ReactNode
}

export function FoodsProvider({ children }: FoodsProviderProps) {
  const [state, dispatch] = useReducer(foodsReducer, initialState)

  return (
    <FoodsContext.Provider value={{ state, dispatch }}>
      {children}
    </FoodsContext.Provider>
  )
}

// Hook
export function useFoods() {
  const context = useContext(FoodsContext)
  if (context === undefined) {
    throw new Error('useFoods must be used within a FoodsProvider')
  }
  return context
}
