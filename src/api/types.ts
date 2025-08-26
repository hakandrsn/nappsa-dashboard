// Supabase veritabanı tipleri - Nappsa Dashboard

// =============================================
// ANA (SABİT VERİ) TABLOLARI
// =============================================

// Food Cuisines (Mutfaklar/Yöreler)
export interface FoodCuisine {
  id: number;
  slug: string;
  created_at: string;
}

// Food Categories (Kategoriler)
export interface FoodCategory {
  id: number;
  slug: string;
  created_at: string;
}

// Food Ingredients (Malzemeler)
export interface FoodIngredient {
  id: number;
  source_id?: string;
  created_at: string;
}

// Food Recipes (Tarifler)
export interface FoodRecipe {
  id: number;
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  cuisine_id?: number;
  created_at: string;
}

// Food Tags (Etiketler)
export interface FoodTag {
  id: number;
  slug: string;
  created_at: string;
}

// Movies (Filmler)
export interface Movie {
  id: number;
  imdb_id: string;
  originaltitle: string;
  type?: string;
  url?: string;
  primaryimage?: string;
  thumbnails?: any;
  trailer?: string;
  releasedate?: string;
  startyear?: number;
  endyear?: number;
  contentrating?: string;
  isadult?: boolean;
  runtimeminutes?: number;
  averagerating?: number;
  numvotes?: number;
  metascore?: number;
  budget?: number;
  grossworldwide?: number;
  countriesoforigin?: string[];
  spokenlanguages?: string[];
  filminglocations?: string[];
  productioncompanies?: any;
  externallinks?: string[];
  created_at: string;
}

// Profiles (Kullanıcı Profilleri)
export interface Profile {
  id: string;
  created_at: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  onboarded?: boolean;
  metadata?: any;
}

// =============================================
// ÇEVİRİ TABLOLARI
// =============================================

// Cuisine Çevirileri
export interface FoodCuisineTranslation {
  id: number;
  cuisine_id: number;
  language_code: string;
  name: string;
}

// Category Çevirileri
export interface FoodCategoryTranslation {
  id: number;
  category_id: number;
  language_code: string;
  name: string;
}

// Ingredient Çevirileri
export interface FoodIngredientTranslation {
  id: number;
  ingredient_id: number;
  language_code: string;
  name: string;
  description?: string;
}

// Recipe Çevirileri
export interface FoodRecipeTranslation {
  id: number;
  recipe_id: number;
  language_code: string;
  title: string;
  description?: string;
  instructions?: string[];
}

// Tag Çevirileri
export interface FoodTagTranslation {
  id: number;
  tag_id: number;
  language_code: string;
  name: string;
}

// Movie Çevirileri
export interface MovieTranslation {
  id: number;
  movie_id: number;
  language_code: string;
  primarytitle: string;
  description?: string;
  genres?: string[];
  interests?: string[];
  created_at: string;
}

// =============================================
// BAĞLANTI (JUNCTION) TABLOLARI
// =============================================

// Tarif-Malzeme Bağlantısı
export interface FoodRecipeIngredient {
  recipe_id: number;
  ingredient_id: number;
  quantity: string;
  unit: string;
  notes?: string;
}

// Tarif-Kategori Bağlantısı
export interface FoodRecipeCategory {
  recipe_id: number;
  category_id: number;
}

// Tarif-Etiket Bağlantısı
export interface FoodRecipeTag {
  recipe_id: number;
  tag_id: number;
}

// =============================================
// ENUM TİPLERİ
// =============================================

export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

// =============================================
// CRUD OPERASYONLARI İÇİN YARDIMCI TİPLER
// =============================================

export type CreateFoodCuisine = Omit<FoodCuisine, 'id' | 'created_at'>;
export type UpdateFoodCuisine = Partial<CreateFoodCuisine> & { id: number };

export type CreateFoodCategory = Omit<FoodCategory, 'id' | 'created_at'>;
export type UpdateFoodCategory = Partial<CreateFoodCategory> & { id: number };

export type CreateFoodIngredient = Omit<FoodIngredient, 'id' | 'created_at'>;
export type UpdateFoodIngredient = Partial<CreateFoodIngredient> & { id: number };

export type CreateFoodRecipe = Omit<FoodRecipe, 'id' | 'created_at'>;
export type UpdateFoodRecipe = Partial<CreateFoodRecipe> & { id: number };

export type CreateFoodTag = Omit<FoodTag, 'id' | 'created_at'>;
export type UpdateFoodTag = Partial<CreateFoodTag> & { id: number };

export type CreateMovie = Omit<Movie, 'id' | 'created_at'>;
export type UpdateMovie = Partial<CreateMovie> & { id: number };

export type CreateProfile = Omit<Profile, 'id' | 'created_at'>;
export type UpdateProfile = Partial<CreateProfile> & { id: string };

// Çeviri tipleri için CRUD
export type CreateFoodCuisineTranslation = Omit<FoodCuisineTranslation, 'id'>;
export type UpdateFoodCuisineTranslation = Partial<CreateFoodCuisineTranslation> & { id: number };

export type CreateFoodCategoryTranslation = Omit<FoodCategoryTranslation, 'id'>;
export type UpdateFoodCategoryTranslation = Partial<CreateFoodCategoryTranslation> & { id: number };

export type CreateFoodIngredientTranslation = Omit<FoodIngredientTranslation, 'id'>;
export type UpdateFoodIngredientTranslation = Partial<CreateFoodIngredientTranslation> & { id: number };

export type CreateFoodRecipeTranslation = Omit<FoodRecipeTranslation, 'id'>;
export type UpdateFoodRecipeTranslation = Partial<CreateFoodRecipeTranslation> & { id: number };

export type CreateFoodTagTranslation = Omit<FoodTagTranslation, 'id'>;
export type UpdateFoodTagTranslation = Partial<CreateFoodTagTranslation> & { id: number };

export type CreateMovieTranslation = Omit<MovieTranslation, 'id' | 'created_at'>;
export type UpdateMovieTranslation = Partial<CreateMovieTranslation> & { id: number };

// =============================================
// PAGINATION VE API YANITLARI
// =============================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalRecipes: number;
  totalIngredients: number;
  totalCategories: number;
  totalCuisines: number;
  totalTags: number;
  totalMovies: number;
  totalUsers: number;
  recentActivity: number;
}

export interface EventAnalytics {
  event: string;
  count: number;
  percentage: number;
}

export interface CategoryAnalytics {
  category: string;
  count: number;
  percentage: number;
}

export interface CuisineAnalytics {
  cuisine: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  events?: number;
  users?: number;
  recipes?: number;
}

export interface UserActivityData {
  period: string;
  active_users: number;
  new_users: number;
  returning_users: number;
}

// =============================================
// HATA TİPLERİ
// =============================================

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// =============================================
// FORM VE VALIDATION TİPLERİ
// =============================================

export interface RecipeFormData {
  title: string;
  description?: string;
  instructions: string[];
  image_url?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  cuisine_id?: number;
  category_ids: number[];
  tag_ids: number[];
  ingredients: {
    ingredient_id: number;
    quantity: string;
    notes?: string;
  }[];
}

export interface MovieFormData {
  imdb_id: string;
  originaltitle: string;
  type?: string;
  url?: string;
  primaryimage?: string;
  trailer?: string;
  releasedate?: string;
  startyear?: number;
  endyear?: number;
  contentrating?: string;
  isadult?: boolean;
  runtimeminutes?: number;
  averagerating?: number;
  numvotes?: number;
  metascore?: number;
  budget?: number;
  grossworldwide?: number;
  countriesoforigin?: string[];
  spokenlanguages?: string[];
  filminglocations?: string[];
  productioncompanies?: any;
  externallinks?: string[];
}

// Flow Types - Mevcut tablolara göre düzenlendi (flow tablosu yok)
export interface FlowQuestion {
  id: number
  slug: string
  is_start_question: boolean
  created_at: string
}

export interface FlowQuestionTranslation {
  question_id: number
  language_code: string
  text: string
}

export interface FlowAnswer {
  id: number
  question_id: number
  next_question_id?: number
  action_id?: number
  parameters?: Record<string, any> // JSONB parameters sütunu
  created_at: string
}

export interface FlowAnswerTranslation {
  answer_id: number
  language_code: string
  text: string
}

export interface FlowAction {
  id: number
  description: string
  action_type: string
  parameters: Record<string, any>
  is_active?: boolean
  priority?: number
  category?: string
  icon?: string
  color?: string
  created_at: string
}

export interface FlowQuestionWithDetails extends FlowQuestion {
  translations: FlowQuestionTranslation[]
  answers: (FlowAnswer & {
    translations: FlowAnswerTranslation[]
    next_question?: FlowQuestion
    action?: FlowAction
  })[]
}

export interface CreateQuestionData {
  slug: string
  is_start_question?: boolean
  translations: { language_code: 'tr' | 'en'; text: string }[] // Dil seçeneği zorunlu
}

export interface CreateAnswerData {
  question_id: number
  next_question_id?: number
  action_id?: number
  parameters?: Record<string, any> // JSONB parameters sütunu
  translations: { language_code: 'tr' | 'en'; text: string }[] // Dil seçeneği zorunlu
}

export interface CreateActionData {
  description: string
  action_type: string
  parameters: Record<string, any>
}

// Action Types
export const ACTION_TYPES = {
  FETCH_RANDOM_RECIPE: 'FETCH_RANDOM_RECIPE',
  FETCH_RECIPE_BY_CUISINE: 'FETCH_RECIPE_BY_CUISINE',
  FETCH_MOVIE_BY_GENRE: 'FETCH_MOVIE_BY_GENRE',
  FETCH_CHAT_TOPIC: 'FETCH_CHAT_TOPIC',
  SHOW_CUSTOM_MESSAGE: 'SHOW_CUSTOM_MESSAGE',
  REDIRECT_TO_URL: 'REDIRECT_TO_URL',
  OPEN_MODAL: 'OPEN_MODAL',
  CALL_API_ENDPOINT: 'CALL_API_ENDPOINT',
  FETCH_USER_PROFILE: 'FETCH_USER_PROFILE',
  FETCH_WEATHER: 'FETCH_WEATHER',
  FETCH_NEWS: 'FETCH_NEWS',
  FETCH_MUSIC_RECOMMENDATION: 'FETCH_MUSIC_RECOMMENDATION',
  FETCH_EXERCISE_SUGGESTION: 'FETCH_EXERCISE_SUGGESTION',
} as const

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES]

// Action Parameters
export interface ActionParameters {
  table_name?: string
  filters?: Record<string, any>
  message?: string
  url?: string
  api_endpoint?: string
  modal_content?: string
  cuisine_slug?: string
  genre_slug?: string
  [key: string]: any
}

// =============================================
// ACTIVITIES SİSTEMİ TİPLERİ
// =============================================

// Activity Categories (Aktivite Kategorileri)
export interface ActivityCategory {
  id: number;
  parent_id?: number;
  slug: string;
  created_at: string;
}

// Activity Category Translations (Kategori Çevirileri)
export interface ActivityCategoryTranslation {
  id: number;
  category_id: number;
  language_code: string;
  name: string;
}

// Activities (Aktiviteler)
export interface Activity {
  id: number;
  created_at: string;
}

// Activity Translations (Aktivite Çevirileri)
export interface ActivityTranslation {
  id: number;
  activity_id: number;
  language_code: string;
  title: string;
  description: string;
}

// Activity Category Links (Aktivite-Kategori Bağlantıları)
export interface ActivityCategoryLink {
  activity_id: number;
  category_id: number;
}

// =============================================
// CREATE/UPDATE TİPLERİ
// =============================================

// Activity Category Create/Update
export interface CreateActivityCategory {
  parent_id?: number;
  slug: string;
  translations: { language_code: 'tr' | 'en'; name: string }[];
}

export interface UpdateActivityCategory {
  parent_id?: number;
  slug?: string;
  translations?: { language_code: 'tr' | 'en'; name: string }[];
}

// Activity Create/Update
export interface CreateActivity {
  translations: { language_code: 'tr' | 'en'; title: string; description: string }[];
  category_ids: number[];
}

export interface UpdateActivity {
  translations?: { language_code: 'tr' | 'en'; title: string; description: string }[];
  category_ids?: number[];
}

// =============================================
// DETAYLI TİPLER
// =============================================

// Activity with Details
export interface ActivityWithDetails extends Activity {
  translations: ActivityTranslation[];
  categories: ActivityCategory[];
}

// Activity Category with Details
export interface ActivityCategoryWithDetails extends ActivityCategory {
  translations: ActivityCategoryTranslation[];
  children?: ActivityCategoryWithDetails[];
  activities?: ActivityWithDetails[];
}

// =============================================
// FILTER TİPLERİ
// =============================================

export interface ActivityFilters {
  search: string;
  category_id: string;
  language: string;
}

export interface ActivityCategoryFilters {
  search: string;
  parent_id: string;
  language: string;
}
