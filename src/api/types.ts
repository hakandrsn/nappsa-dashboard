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

export type RecipeDifficulty = 'Kolay' | 'Orta' | 'Zor';

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
