import { useState, useEffect } from 'react'
import type { Activity, ActivityCategory } from '@/api/types'
import { ActivitiesProvider, useActivities } from '@/contexts/ActivitiesContext'
import { useActivitiesApi } from '@/hooks/use-activities-api'
import { useLanguage } from '@/contexts/LanguageContext'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Activity as ActivityIcon, 
  FolderOpen, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X
} from 'lucide-react'
import { ActivityFormModal } from './ActivityFormModal'
import { CategoryFormModal } from './CategoryFormModal'


function ActivitiesPageContent() {
  const { state, dispatch } = useActivities()
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
  const { 
    fetchActivities, 
    fetchCategories, 
    getTranslation,
    updateActivityFilters,
    updateCategoryFilters,
    resetActivityFilters,
    resetCategoryFilters,
    loading 
  } = useActivitiesApi()

  // Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ActivityCategory | null>(null)

  // Sayfa yüklendiğinde ve dil değiştiğinde verileri getir
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchActivities({ page: 1, limit: 50 }),
          fetchCategories({ page: 1, limit: 1000 }) // Tüm kategorileri yükle
        ])
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error)
      }
    }

    loadInitialData()
  }, [fetchActivities, fetchCategories, currentLanguage])

  // Tab değiştiğinde
  const handleTabChange = (value: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: value as any })
  }

  // Aktivite işlemleri
  const handleCreateActivity = () => {
    setEditingActivity(null)
    setIsActivityModalOpen(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity)
    setIsActivityModalOpen(true)
  }

  const handleDeleteActivity = async (id: number) => {
    if (confirm('Bu aktiviteyi silmek istediğinizden emin misiniz?')) {
      try {
        // API'den silme işlemi burada yapılacak
        console.log('Aktivite silindi:', id)
      } catch (error) {
        console.error('Aktivite silinirken hata:', error)
      }
    }
  }

  // Kategori işlemleri
  const handleCreateCategory = () => {
    setEditingCategory(null)
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: ActivityCategory) => {
    setEditingCategory(category)
    setIsCategoryModalOpen(true)
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      try {
        // API'den silme işlemi burada yapılacak
        console.log('Kategori silindi:', id)
      } catch (error) {
        console.error('Kategori silinirken hata:', error)
      }
    }
  }

  // Filtre işlemleri
  const handleActivitySearch = (value: string) => {
    updateActivityFilters({ search: value })
  }

  const handleCategorySearch = (value: string) => {
    updateCategoryFilters({ search: value })
  }

  const handleCategoryFilter = (value: string) => {
    if (value === 'all') {
      updateActivityFilters({ category_id: '' })
    } else {
      updateActivityFilters({ category_id: value })
    }
  }

  const handleParentCategoryFilter = (value: string) => {
    if (value === 'all') {
      updateCategoryFilters({ parent_id: '' })
    } else if (value === 'main') {
      updateCategoryFilters({ parent_id: 'null' })
    } else {
      updateCategoryFilters({ parent_id: value })
    }
  }

  // Ana kategorileri getir (parent_id null olanlar)
  const mainCategories = state.categories.filter(cat => !cat.parent_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aktiviteler</h1>
          <p className="text-muted-foreground">
            Kullanıcılar için aktivite önerilerini yönetin
          </p>
        </div>
        
        {/* Dil Seçici */}
        <div className="flex items-center space-x-2">
          <Select value={currentLanguage} onValueChange={setLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={state.activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities" className="flex items-center space-x-2">
            <ActivityIcon className="h-4 w-4" />
            <span>Aktiviteler</span>
            <Badge variant="secondary">{state.activitiesCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>Kategoriler</span>
            <Badge variant="secondary">{state.categoriesCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtreler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arama</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Aktivite ara..."
                      value={state.activeFilters.activities.search}
                      onChange={(e) => handleActivitySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kategori</label>
                  <Select 
                    value={state.activeFilters.activities.category_id || 'all'} 
                    onValueChange={handleCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm kategoriler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm kategoriler</SelectItem>
                      {state.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {getTranslation(state.categoryTranslations[category.id] || [], 'name')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={resetActivityFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Filtreleri Temizle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Aktiviteler</h2>
            <Button onClick={handleCreateActivity}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Aktivite
            </Button>
          </div>

          {/* Activities List */}
          <div className="grid gap-4">
            {state.activities.map((activity) => {
              const translations = state.activityTranslations[activity.id] || []
              const title = getTranslation(translations, 'title')
              const description = getTranslation(translations, 'description')
              
              return (
                <Card key={activity.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{title || 'Başlıksız'}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {description || 'Açıklama yok'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditActivity(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
            
            {state.activities.length === 0 && !loading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz aktivite eklenmemiş
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtreler</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arama</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Kategori ara..."
                      value={state.activeFilters.categories.search}
                      onChange={(e) => handleCategorySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Üst Kategori</label>
                  <Select 
                    value={state.activeFilters.categories.parent_id || 'all'} 
                    onValueChange={handleParentCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm kategoriler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm kategoriler</SelectItem>
                      <SelectItem value="main">Ana kategoriler</SelectItem>
                      {mainCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {getTranslation(state.categoryTranslations[category.id] || [], 'name')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={resetCategoryFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Filtreleri Temizle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Kategoriler</h2>
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kategori
            </Button>
          </div>

          {/* Categories List */}
          <div className="grid gap-4">
            {state.categories.map((category) => {
              const translations = state.categoryTranslations[category.id] || []
              const name = getTranslation(translations, 'name')
              const isMainCategory = !category.parent_id
              const parentCategory = category.parent_id 
                ? state.categories.find(c => c.id === category.parent_id)
                : null
              const parentName = parentCategory 
                ? getTranslation(state.categoryTranslations[parentCategory.id] || [], 'name')
                : null
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{name || 'İsimsiz'}</CardTitle>
                        <CardDescription>
                          Slug: {category.slug}
                          {parentName && (
                            <span className="ml-2">
                              • Üst kategori: {parentName}
                            </span>
                          )}
                        </CardDescription>
                        {isMainCategory && (
                          <Badge variant="secondary">Ana Kategori</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
            
            {state.categories.length === 0 && !loading && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz kategori eklenmemiş
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ActivityFormModal
        open={isActivityModalOpen}
        onOpenChange={setIsActivityModalOpen}
        activity={editingActivity}
        onSuccess={() => {
          setIsActivityModalOpen(false)
          fetchActivities({ page: 1, limit: 50 })
        }}
      />

      <CategoryFormModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        category={editingCategory}
        onSuccess={() => {
          setIsCategoryModalOpen(false)
          fetchCategories({ page: 1, limit: 1000 })
        }}
      />
    </div>
  )
}

export function ActivitiesPage() {
  return (
    <ActivitiesProvider>
      <ActivitiesPageContent />
    </ActivitiesProvider>
  )
}
