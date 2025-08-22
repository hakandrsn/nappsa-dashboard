import { useState, useEffect } from 'react'
import type { FoodRecipe, FoodIngredient, FoodCategory, FoodCuisine, FoodTag } from '@/api/types'
import { FoodsProvider, useFoods } from '@/contexts/FoodsContext'
import { useFoodsApi } from '@/hooks/use-foods-api'
import { useLanguage } from '@/contexts/LanguageContext'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecipeFormModal } from './RecipeFormModal'
import { BulkRecipesModal } from './BulkRecipesModal'
import { RecipeViewModal } from './RecipeViewModal'
import { 
  ChefHat, 
  Utensils, 
  Tags, 
  Globe, 
  Plus,
  Edit,
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { formatRecipeData, formatIngredientData, formatCategoryData, formatCuisineData, formatTagData } from '@/lib/foods-utils'

function FoodsPageContent() {
  const { state, dispatch } = useFoods()
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const { 
    fetchRecipes, 
    fetchIngredients, 
    fetchCategories, 
    fetchCuisines, 
    fetchTags,
    fetchRecipeIngredients,
    fetchRecipeCategories,
    fetchRecipeCuisines,
    loading 
  } = useFoodsApi()

  // Modal states
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<FoodRecipe | null>(null)
  const [isBulkRecipesModalOpen, setIsBulkRecipesModalOpen] = useState(false)
  
  // Tarif görüntüleme modal state'i
  const [isViewRecipeModalOpen, setIsViewRecipeModalOpen] = useState(false)
  const [viewingRecipe, setViewingRecipe] = useState<FoodRecipe | null>(null)
  
  // Diğer modal state'leri
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<FoodIngredient | null>(null)
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null)
  
  const [isCuisineModalOpen, setIsCuisineModalOpen] = useState(false)
  const [editingCuisine, setEditingCuisine] = useState<FoodCuisine | null>(null)
  
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<FoodTag | null>(null)

  // Sayfa yüklendiğinde ve dil değiştiğinde verileri getir
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchRecipes({ page: 1, limit: 50 }),
          fetchIngredients({ page: 1, limit: 50 }),
          fetchCategories({ page: 1, limit: 50 }),
          fetchCuisines({ page: 1, limit: 50 }),
          fetchTags({ page: 1, limit: 50 })
        ])
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error)
      }
    }

    loadInitialData()
  }, [fetchRecipes, fetchIngredients, fetchCategories, fetchCuisines, fetchTags, currentLanguage])

  // Debug: ingredients state değişimini izle
  useEffect(() => {
    console.log('Ingredients state changed:', state.ingredients.length)
  }, [state.ingredients.length])

  // Tab değiştiğinde
  const handleTabChange = (value: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: value as any })
  }

  // Daha fazla yükle butonları için handler'lar
  const handleLoadMore = async (type: 'recipes' | 'ingredients' | 'categories' | 'cuisines' | 'tags') => {
    try {
      let currentPage = 1
      
      switch (type) {
        case 'recipes':
          currentPage = state.recipesPagination.page
          await fetchRecipes({ page: currentPage + 1, limit: 50 })
          break
        case 'ingredients':
          currentPage = state.ingredientsPagination.page
          await fetchIngredients({ page: currentPage + 1, limit: 50 })
          break
        case 'categories':
          currentPage = state.categoriesPagination.page
          await fetchCategories({ page: currentPage + 1, limit: 50 })
          break
        case 'cuisines':
          currentPage = state.cuisinesPagination.page
          await fetchCuisines({ page: currentPage + 1, limit: 50 })
          break
        case 'tags':
          currentPage = state.tagsPagination.page
          await fetchTags({ page: currentPage + 1, limit: 50 })
          break
      }
    } catch (error) {
      console.error(`${type} yüklenirken hata:`, error)
    }
  }

  // Modal handlers
  const closeRecipeModal = () => {
    setIsRecipeModalOpen(false)
    setEditingRecipe(null)
  }

  const closeIngredientModal = () => {
    setIsIngredientModalOpen(false)
    setEditingIngredient(null)
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }

  const closeCuisineModal = () => {
    setIsCuisineModalOpen(false)
    setEditingCuisine(null)
  }

  const closeTagModal = () => {
    setIsTagModalOpen(false)
    setEditingTag(null)
  }

  // Düzenle butonları için handler'lar
  const handleEdit = (type: 'recipe' | 'ingredient' | 'category' | 'cuisine' | 'tag', item: any) => {
    console.log('Edit clicked for:', type, item)
    
    switch (type) {
      case 'recipe':
        setEditingRecipe(item)
        setIsRecipeModalOpen(true)
        break
      case 'ingredient':
        setEditingIngredient(item)
        setIsIngredientModalOpen(true)
        break
      case 'category':
        setEditingCategory(item)
        setIsCategoryModalOpen(true)
        break
      case 'cuisine':
        setEditingCuisine(item)
        setIsCuisineModalOpen(true)
        break
      case 'tag':
        setEditingTag(item)
        setIsTagModalOpen(true)
        break
    }
  }

  // Tarif görüntüleme handler'ı
  const handleViewRecipe = async (recipe: FoodRecipe) => {
    try {
      console.log(`🔍 Tarif detayları yükleniyor: ${recipe.id}`)
      
      // Junction table verilerini paralel olarak çek
      const [ingredients, categories, cuisines] = await Promise.all([
        fetchRecipeIngredients(recipe.id),
        fetchRecipeCategories(recipe.id),
        fetchRecipeCuisines(recipe.id)
      ])

      console.log(`✅ Junction table verileri yüklendi:`, {
        ingredients: ingredients.length,
        categories: categories.length,
        cuisines: cuisines.length
      })

      // State'e junction table verilerini ekle
      dispatch({ 
        type: 'SET_RECIPE_INGREDIENTS', 
        payload: { recipeId: recipe.id, ingredients } 
      })
      
      dispatch({ 
        type: 'SET_RECIPE_CATEGORIES', 
        payload: { recipeId: recipe.id, categories } 
      })
      
      dispatch({ 
        type: 'SET_RECIPE_CUISINES', 
        payload: { recipeId: recipe.id, cuisines } 
      })

      setViewingRecipe(recipe)
      setIsViewRecipeModalOpen(true)
    } catch (error) {
      console.error('❌ Tarif detayları yüklenirken hata:', error)
      alert('Tarif detayları yüklenirken bir hata oluştu.')
    }
  }

  // Tarif görüntüleme modal'ını kapat
  const closeViewRecipeModal = () => {
    setIsViewRecipeModalOpen(false)
    setViewingRecipe(null)
  }

  // İstatistikler
  const stats = {
    totalRecipes: state.recipesCount,
    totalIngredients: state.ingredientsCount,
    totalCategories: state.categoriesCount,
    totalCuisines: state.cuisinesCount,
    totalTags: state.tagsCount
  }

  // Veri düzeltme fonksiyonu
  const handleFixRecipeData = async () => {
    console.log('Veri düzeltme başlatılıyor...')
    try {
      // Önce mevcut kategorileri ve mutfakları kontrol et
      if (state.categories.length === 0 || state.cuisines.length === 0) {
        alert('Önce kategoriler ve mutfaklar yüklenmelidir. Lütfen sayfayı yenileyin.')
        return
      }

      // TheMealDB'den gelen kategori isimlerini bizim kategorilerimizle eşleştir
      const categoryMapping: Record<string, number> = {}
      state.categories.forEach(category => {
        const translations = state.categoryTranslations[category.id] || []
        const trName = translations.find(t => t.language_code === 'tr')?.name || ''
        const enName = translations.find(t => t.language_code === 'en')?.name || ''
        
        if (trName) categoryMapping[trName.toLowerCase()] = category.id
        if (enName) categoryMapping[enName.toLowerCase()] = category.id
      })

      // TheMealDB'den gelen mutfak isimlerini bizim mutfaklarımızla eşleştir
      const cuisineMapping: Record<string, number> = {}
      state.cuisines.forEach(cuisine => {
        const translations = state.cuisineTranslations[cuisine.id] || []
        const trName = translations.find(t => t.language_code === 'tr')?.name || ''
        const enName = translations.find(t => t.language_code === 'en')?.name || ''
        
        if (trName) cuisineMapping[trName.toLowerCase()] = cuisine.id
        if (enName) cuisineMapping[enName.toLowerCase()] = cuisine.id
      })

      console.log('Kategori mapping:', categoryMapping)
      console.log('Mutfak mapping:', cuisineMapping)

      // Eksik kategorileri ve mutfakları tespit et
      const missingCategories: string[] = []
      const missingCuisines: string[] = []

      state.recipes.forEach(recipe => {
        const translations = state.recipeTranslations[recipe.id] || []
        const trTranslation = translations.find(t => t.language_code === 'tr')
        
        if (trTranslation?.title) {
          // Basit bir kategori tahmini yap (ilk kelimeyi al)
          const firstWord = trTranslation.title.split(' ')[0].toLowerCase()
          if (!categoryMapping[firstWord] && !missingCategories.includes(firstWord)) {
            missingCategories.push(firstWord)
          }
        }
      })

      // Eksik kategorileri ve mutfakları göster
      if (missingCategories.length > 0 || missingCuisines.length > 0) {
        let message = 'Eksik kategoriler ve mutfaklar tespit edildi:\n\n'
        if (missingCategories.length > 0) {
          message += `Kategoriler: ${missingCategories.join(', ')}\n`
        }
        if (missingCuisines.length > 0) {
          message += `Mutfaklar: ${missingCuisines.join(', ')}\n`
        }
        message += '\nBu kategorileri ve mutfakları manuel olarak eklemeniz gerekiyor.'
        
        alert(message)
        return
      }

      // Şimdi tarifleri düzelt
      let fixedCount = 0
      for (const recipe of state.recipes) {
        const translations = state.recipeTranslations[recipe.id] || []
        const trTranslation = translations.find(t => t.language_code === 'tr')
        
        if (trTranslation?.title) {
          const firstWord = trTranslation.title.split(' ')[0].toLowerCase()
          const categoryId = categoryMapping[firstWord]
          
          if (categoryId && (!state.recipeCategories[recipe.id] || state.recipeCategories[recipe.id].length === 0)) {
            // Kategori ekle
            dispatch({ 
              type: 'ADD_RECIPE_CATEGORY', 
              payload: { recipeId: recipe.id, categoryId } 
            })
            fixedCount++
          }
        }
      }

      if (fixedCount > 0) {
        alert(`${fixedCount} adet tarifin kategorisi düzeltildi.`)
      } else {
        alert('Düzeltilmesi gereken tarif bulunamadı.')
      }

    } catch (error) {
      console.error('Veri düzeltme sırasında hata:', error)
      alert('Veri düzeltme sırasında bir hata oluştu.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Yiyecekler</h1>
          <p className="text-muted-foreground">
            Tarifler, malzemeler, kategoriler ve mutfak yönetimi
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Dil Seçici */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dil:</span>
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 text-sm border rounded-md bg-background"
            >
              {availableLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'tr' ? 'Türkçe' : 
                   lang === 'en' ? 'English' : 
                   lang === 'de' ? 'Deutsch' : 
                   lang === 'fr' ? 'Français' : 
                   lang === 'es' ? 'Español' : lang}
                </option>
              ))}
            </select>
          </div>
          
          {/* Toplu Tarif Ekle */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsBulkRecipesModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Toplu Ekle
          </Button>

          <Button size="sm" onClick={() => handleEdit('recipe', null)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ekle
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Tarif</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +12% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Malzeme</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIngredients.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +8% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +5% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutfaklar</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCuisines.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +3% geçen aydan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etiketler</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTags.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">
              +15% geçen aydan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={state.activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recipes">Tarifler</TabsTrigger>
          <TabsTrigger value="ingredients">Malzemeler</TabsTrigger>
          <TabsTrigger value="categories">Kategoriler</TabsTrigger>
          <TabsTrigger value="cuisines">Mutfaklar</TabsTrigger>
          <TabsTrigger value="tags">Etiketler</TabsTrigger>
        </TabsList>

        {/* Tarifler Tab */}
        <TabsContent value="recipes" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-bold">Tarifler</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleEdit('recipe', null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tek Tarif Ekle
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsBulkRecipesModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Toplu Tarif Ekle
              </Button>
              <Button variant="outline" size="sm" onClick={handleFixRecipeData}>
                <Download className="h-4 w-4 mr-2" />
                Veri Düzeltme
              </Button>
            </div>
          </div>

          {/* Tarif Listesi */}
          <div className="text-sm text-muted-foreground mb-2">
            Toplam {state.recipesCount} tarif, yüklenen: {state.recipes.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.recipes.map((recipe) => {
                        const translations = state.recipeTranslations[recipe.id] || []
          const formatted = formatRecipeData(recipe, translations, currentLanguage)
              return (
                <Card key={recipe.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {formatted.image ? (
                      <img 
                        src={formatted.image} 
                        alt={formatted.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{formatted.title}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{formatted.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatted.prepTime} + {formatted.cookTime}
                        </span>
                      </span>
                      <span className="text-sm text-muted-foreground mt-1">
                        {formatted.servings}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewRecipe(recipe)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Görüntüle
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit('recipe', recipe)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.recipes.length < state.recipesCount && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => handleLoadMore('recipes')}
              >
                Daha Fazla Yükle (+50)
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Malzemeler Tab */}
        <TabsContent value="ingredients" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-bold">Malzemeler</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleEdit('ingredient', null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tek Malzeme Ekle
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Toplu Malzeme Ekle
              </Button>
            </div>
          </div>

          {/* Malzeme Listesi */}
          <div className="text-sm text-muted-foreground mb-2">
            Toplam {state.ingredientsCount} malzeme, yüklenen: {state.ingredients.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {state.ingredients.map((ingredient) => {
              const translations = state.ingredientTranslations[ingredient.id] || []
              const formatted = formatIngredientData(ingredient, translations, currentLanguage)
              
              return (
                <Card key={ingredient.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{formatted.name}</CardTitle>
                    </div>
                    {formatted.sourceId && (
                      <CardDescription>
                        <span className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {formatted.sourceId}
                        </span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.ingredients.length < state.ingredientsCount && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => handleLoadMore('ingredients')}
              >
                Daha Fazla Yükle (+50) - {state.ingredients.length}/{state.ingredientsCount}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Kategoriler Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-bold">Kategoriler</h2>
            <Button size="sm" onClick={() => handleEdit('category', null)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kategori
            </Button>
          </div>

                    {/* Kategori Listesi */}
          <div className="text-sm text-muted-foreground mb-2">
            Toplam {state.categoriesCount} kategori, yüklenen: {state.categories.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.categories.map((category) => {
          const translations = state.categoryTranslations[category.id] || []
          const formatted = formatCategoryData(category, translations, currentLanguage)
          return (
                <Card key={category.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                      <Tags className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{formatted.name}</CardTitle>
                    </div>
                    <CardDescription>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatted.slug}
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.categories.length < state.categoriesCount && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => handleLoadMore('categories')}
              >
                Daha Fazla Yükle (+50) - {state.categories.length}/{state.categoriesCount}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Mutfaklar Tab */}
        <TabsContent value="cuisines" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-bold">Mutfaklar</h2>
            <Button size="sm" onClick={() => handleEdit('cuisine', null)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Mutfak
            </Button>
          </div>

          {/* Mutfak Listesi */}
          <div className="text-sm text-muted-foreground mb-2">
            Toplam {state.cuisinesCount} mutfak, yüklenen: {state.cuisines.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {state.cuisines.map((cuisine) => {
              const translations = state.cuisineTranslations[cuisine.id] || []
              const formatted = formatCuisineData(cuisine, translations, currentLanguage)
              return (
                <Card key={cuisine.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{formatted.name}</CardTitle>
                    </div>
                    <CardDescription>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatted.slug}
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.cuisines.length < state.cuisinesCount && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => handleLoadMore('cuisines')}
              >
                Daha Fazla Yükle (+50) - {state.cuisines.length}/{state.cuisinesCount}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Etiketler Tab */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h2 className="text-2xl font-bold">Etiketler</h2>
            <Button size="sm" onClick={() => handleEdit('tag', null)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Etiket
            </Button>
          </div>

          {/* Etiket Listesi */}
          <div className="text-sm text-muted-foreground mb-2">
            Toplam {state.tagsCount} etiket, yüklenen: {state.tags.length}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {state.tags.map((tag) => {
              const translations = state.tagTranslations[tag.id] || []
              const formatted = formatTagData(tag, translations, currentLanguage)
              return (
                <Card key={tag.id}>
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2">
                      <Tags className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{formatted.name}</CardTitle>
                    </div>
                    <CardDescription>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatted.slug}
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {state.tags.length < state.tagsCount && (
            <div className="text-center">
              <Button 
                variant="outline"
                onClick={() => handleLoadMore('tags')}
              >
                Daha Fazla Yükle (+50) - {state.tags.length}/{state.tagsCount}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Yükleniyor...</span>
        </div>
      )}

      {/* Recipe Form Modal */}
      <RecipeFormModal
        isOpen={isRecipeModalOpen}
        onClose={closeRecipeModal}
        recipe={editingRecipe}
        mode={editingRecipe ? 'edit' : 'create'}
      />

      {/* Tarif Görüntüleme Modal */}
      {isViewRecipeModalOpen && viewingRecipe && (
        <RecipeViewModal
          recipe={viewingRecipe}
          translations={state.recipeTranslations[viewingRecipe.id] || []}
          ingredients={state.recipeIngredients[viewingRecipe.id]?.map(ri => {
            const ingredient = state.ingredients.find(i => i.id === ri.ingredient_id)
            if (!ingredient) return null
            
            return {
              ingredient: ingredient,
              quantity: ri.quantity,
              unit: ri.unit,
              notes: undefined
            }
          }).filter((item): item is NonNullable<typeof item> => item !== null) || []}
          categories={state.recipeCategories[viewingRecipe.id]?.map(rc => {
            const category = state.categories.find(c => c.id === rc.category_id)
            if (!category) return null
            
            // Kategori çevirilerini bul
            const categoryTranslations = state.categoryTranslations[category.id] || []
            const categoryName = categoryTranslations.find(t => t.language_code === currentLanguage)?.name || category.slug
            
            return { ...category, name: categoryName }
          }).filter((item): item is NonNullable<typeof item> => item !== null) || []}
          cuisines={state.recipeCuisines[viewingRecipe.id]?.map(rc => {
            const cuisine = state.cuisines.find(c => c.id === rc.cuisine_id)
            if (!cuisine) return null
            
            // Mutfak çevirilerini bul
            const cuisineTranslations = state.cuisineTranslations[cuisine.id] || []
            const cuisineName = cuisineTranslations.find(t => t.language_code === currentLanguage)?.name || cuisine.slug
            
            return { ...cuisine, name: cuisineName }
          }).filter((item): item is NonNullable<typeof item> => item !== null) || []}
          ingredientTranslations={state.ingredientTranslations}
          isOpen={isViewRecipeModalOpen}
          onClose={closeViewRecipeModal}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Bulk Recipes Modal */}
      <BulkRecipesModal
        isOpen={isBulkRecipesModalOpen}
        onClose={() => setIsBulkRecipesModalOpen(false)}
      />

      {/* Basit Modal'lar */}
      {/* Ingredient Modal */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingIngredient ? 'Malzeme Düzenle' : 'Yeni Malzeme Ekle'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeIngredientModal}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Ana Bilgiler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Ana Bilgiler</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Kaynak ID</label>
                    <input 
                      type="text" 
                      placeholder="Kaynak ID (opsiyonel)"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingIngredient?.source_id || ''}
                    />
                  </div>
                </div>
              </div>

              {/* Çeviriler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Çeviriler</h4>
                
                {/* Türkçe */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇹🇷 Türkçe</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Malzeme Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Malzeme adını girin"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingIngredient ? 
                        state.ingredientTranslations[editingIngredient.id]?.find(t => t.language_code === 'tr')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Malzeme açıklaması"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingIngredient ? 
                        state.ingredientTranslations[editingIngredient.id]?.find(t => t.language_code === 'tr')?.description || '' : ''
                      }
                    />
                  </div>
                </div>

                {/* İngilizce */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇬🇧 English</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Malzeme Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Ingredient name"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingIngredient ? 
                        state.ingredientTranslations[editingIngredient.id]?.find(t => t.language_code === 'en')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Ingredient description"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingIngredient ? 
                        state.ingredientTranslations[editingIngredient.id]?.find(t => t.language_code === 'en')?.description || '' : ''
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t">
              <Button variant="outline" onClick={closeIngredientModal}>
                İptal
              </Button>
              <Button onClick={() => {
                console.log('Malzeme kaydediliyor...')
                closeIngredientModal()
              }}>
                {editingIngredient ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeCategoryModal}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Ana Bilgiler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Ana Bilgiler</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug *</label>
                    <input 
                      type="text" 
                      placeholder="kategori-adi"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCategory?.slug || ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sadece küçük harf, rakam ve tire kullanın
                    </p>
                  </div>
                </div>
              </div>

              {/* Çeviriler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Çeviriler</h4>
                
                {/* Türkçe */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇹🇷 Türkçe</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Kategori adını girin"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCategory ? 
                        state.categoryTranslations[editingCategory.id]?.find(t => t.language_code === 'tr')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Kategori açıklaması (opsiyonel)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>

                {/* İngilizce */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇬🇧 English</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Kategori Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Category name"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCategory ? 
                        state.categoryTranslations[editingCategory.id]?.find(t => t.language_code === 'en')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Category description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t">
              <Button variant="outline" onClick={closeCategoryModal}>
                İptal
              </Button>
              <Button onClick={() => {
                console.log('Kategori kaydediliyor...')
                closeCategoryModal()
              }}>
                {editingCategory ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cuisine Modal */}
      {isCuisineModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingCuisine ? 'Mutfak Düzenle' : 'Yeni Mutfak Ekle'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeCuisineModal}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Ana Bilgiler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Ana Bilgiler</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug *</label>
                    <input 
                      type="text" 
                      placeholder="mutfak-adi"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCuisine?.slug || ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sadece küçük harf, rakam ve tire kullanın
                    </p>
                  </div>
                </div>
              </div>

              {/* Çeviriler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Çeviriler</h4>
                
                {/* Türkçe */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇹🇷 Türkçe</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mutfak Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Mutfak adını girin"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCuisine ? 
                        state.cuisineTranslations[editingCuisine.id]?.find(t => t.language_code === 'tr')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Mutfak açıklaması (opsiyonel)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>

                {/* İngilizce */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇬🇧 English</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mutfak Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Cuisine name"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingCuisine ? 
                        state.cuisineTranslations[editingCuisine.id]?.find(t => t.language_code === 'en')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Cuisine description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t">
              <Button variant="outline" onClick={closeCuisineModal}>
                İptal
              </Button>
              <Button onClick={() => {
                console.log('Mutfak kaydediliyor...')
                closeCuisineModal()
              }}>
                {editingCuisine ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingTag ? 'Etiket Düzenle' : 'Yeni Etiket Ekle'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeTagModal}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Ana Bilgiler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Ana Bilgiler</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Slug *</label>
                    <input 
                      type="text" 
                      placeholder="etiket-adi"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingTag?.slug || ''}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sadece küçük harf, rakam ve tire kullanın
                    </p>
                  </div>
                </div>
              </div>

              {/* Çeviriler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Çeviriler</h4>
                
                {/* Türkçe */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇹🇷 Türkçe</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Etiket Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Etiket adını girin"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingTag ? 
                        state.tagTranslations[editingTag.id]?.find(t => t.language_code === 'tr')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Etiket açıklaması (opsiyonel)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>

                {/* İngilizce */}
                <div className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">🇬🇧 English</h5>
                  <div>
                    <label className="block text-sm font-medium mb-2">Etiket Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Tag name"
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue={editingTag ? 
                        state.tagTranslations[editingTag.id]?.find(t => t.language_code === 'en')?.name || '' : ''
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Açıklama</label>
                    <textarea 
                      placeholder="Tag description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      defaultValue=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8 pt-6 border-t">
              <Button variant="outline" onClick={closeTagModal}>
                İptal
              </Button>
              <Button onClick={() => {
                console.log('Etiket kaydediliyor...')
                closeTagModal()
              }}>
                {editingTag ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function FoodsPage() {
  return (
    <FoodsProvider>
      <FoodsPageContent />
    </FoodsProvider>
  )
}
