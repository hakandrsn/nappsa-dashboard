import { useState, useEffect } from 'react'
import type { FoodIngredient } from '@/api/types'
import { useFoods } from '@/contexts/FoodsContext'
import { useFoodsApi } from '@/hooks/use-foods-api'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/api/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Utensils, Edit, Save } from 'lucide-react'

interface IngredientModalProps {
  isOpen: boolean
  onClose: () => void
  editingIngredient?: FoodIngredient | null
  viewingIngredient?: FoodIngredient | null
}

export function IngredientModal({ isOpen, onClose, editingIngredient, viewingIngredient }: IngredientModalProps) {
  const { state, dispatch } = useFoods()
  const { availableLanguages } = useLanguage()
  const { createIngredient, updateIngredient } = useFoodsApi()
  
  const [isLoading, setIsLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [ingredientDetails, setIngredientDetails] = useState<{
    usedInRecipes: Array<{ id: number; title: string; quantity: string; unit?: string; notes?: string }>
  } | null>(null)
  const [formData, setFormData] = useState({
    source_id: '',
    translations: {} as Record<string, { name: string; description: string }>
  })

  // Dil seçeneklerini dinamik olarak initialize et
  useEffect(() => {
    const initialTranslations: Record<string, { name: string; description: string }> = {}
    availableLanguages.forEach(lang => {
      initialTranslations[lang.code] = { name: '', description: '' }
    })
    
    setFormData(prev => ({
      ...prev,
      translations: initialTranslations
    }))
  }, [availableLanguages])

  // Detaylı veri çekme fonksiyonu
  const fetchIngredientDetails = async (ingredientId: number) => {
    setDetailsLoading(true)
    try {
      // Supabase'den malzemenin kullanıldığı tarifleri getir
      const { data: recipeIngredients, error } = await supabase
        .from('food_recipe_ingredients')
        .select(`
          quantity,
          unit,
          notes,
          food_recipes!inner (
            id,
            food_recipe_translations (
              title,
              language_code
            )
          )
        `)
        .eq('ingredient_id', ingredientId)

      if (error) throw error

      const usedInRecipes = recipeIngredients?.map((ri: any) => {
        const recipe = ri.food_recipes
        const translations = recipe?.food_recipe_translations || []
        
        // Mevcut dildeki başlığı bul, yoksa ilk çeviriyi kullan
        const currentLanguageTitle = translations.find((t: any) => t.language_code === 'tr')?.title
        const fallbackTitle = translations[0]?.title || 'Adsız Tarif'
        
        return {
          id: recipe?.id || 0,
          title: currentLanguageTitle || fallbackTitle,
          quantity: ri.quantity,
          unit: ri.unit,
          notes: ri.notes
        }
      }) || []

      setIngredientDetails({ usedInRecipes })
    } catch (error) {
      console.error('Malzeme detayları yüklenirken hata:', error)
      setIngredientDetails({ usedInRecipes: [] })
    } finally {
      setDetailsLoading(false)
    }
  }

  // Form verilerini sıfırla ve detayları yükle
  useEffect(() => {
    if (editingIngredient || viewingIngredient) {
      const ingredient = editingIngredient || viewingIngredient!
      const translations = state.ingredientTranslations[ingredient.id] || []
      
      // Tüm diller için çevirileri yükle
      const dynamicTranslations: Record<string, { name: string; description: string }> = {}
      availableLanguages.forEach(lang => {
        const translation = translations.find(t => t.language_code === lang.code)
        dynamicTranslations[lang.code] = {
          name: translation?.name || '',
          description: translation?.description || ''
        }
      })
      
      setFormData({
        source_id: ingredient.source_id || '',
        translations: dynamicTranslations
      })

      // Görüntüleme modunda detayları yükle
      if (viewingIngredient) {
        fetchIngredientDetails(viewingIngredient.id)
      }
    } else {
      // Yeni ekleme için boş form
      const emptyTranslations: Record<string, { name: string; description: string }> = {}
      availableLanguages.forEach(lang => {
        emptyTranslations[lang.code] = { name: '', description: '' }
      })
      
      setFormData({
        source_id: '',
        translations: emptyTranslations
      })
      setIngredientDetails(null)
    }
  }, [editingIngredient, viewingIngredient, state.ingredientTranslations, availableLanguages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (viewingIngredient) return // Görüntüleme modunda kaydetme yok
    
    setIsLoading(true)
    
    try {
      if (editingIngredient) {
        // Güncelleme - çevirileri hazırla
        const translations = Object.entries(formData.translations)
          .filter(([, translation]) => translation.name.trim())
          .map(([lang, translation]) => ({
            language_code: lang,
            name: translation.name,
            description: translation.description
          }))
        
        const { data, error } = await updateIngredient(
          editingIngredient.id,
          { id: editingIngredient.id, source_id: formData.source_id },
          translations
        )
        if (error) throw error
        
        if (data) {
          dispatch({ type: 'UPDATE_INGREDIENT', payload: data })
        }
        onClose()
      } else {
        // Yeni oluşturma - çevirileri hazırla
        const translations = Object.entries(formData.translations)
          .filter(([, translation]) => translation.name.trim())
          .map(([lang, translation]) => ({
            language_code: lang,
            name: translation.name,
            description: translation.description
          }))
        
        const { data, error } = await createIngredient(
          { source_id: formData.source_id },
          translations
        )
        if (error) throw error
        
        if (data) {
          dispatch({ type: 'ADD_INGREDIENT', payload: data })
        }
        onClose()
      }
    } catch (error) {
      console.error('Malzeme kaydedilirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }



  const isViewMode = !!viewingIngredient
  const isEditMode = !!editingIngredient
  const isCreateMode = !viewingIngredient && !editingIngredient

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {isViewMode && 'Malzeme Görüntüle'}
            {isEditMode && 'Malzeme Düzenle'}
            {isCreateMode && 'Yeni Malzeme Ekle'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode && 'Malzeme detaylarını görüntüleyin'}
            {isEditMode && 'Malzeme bilgilerini düzenleyin'}
            {isCreateMode && 'Yeni malzeme oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ana Bilgiler */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Ana Bilgiler</h4>
            
            <div>
              <Label htmlFor="source_id">Source ID</Label>
              <Input
                id="source_id"
                value={formData.source_id}
                onChange={(e) => setFormData(prev => ({ ...prev, source_id: e.target.value }))}
                placeholder="malzeme-adi"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Malzeme için benzersiz tanımlayıcı
              </p>
            </div>
          </div>

          {/* Detaylı Bilgiler - Sadece görüntüleme modunda */}
          {isViewMode && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Kullanıldığı Tarifler</h4>
              {detailsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <span className="ml-2 text-muted-foreground">Veriler yükleniyor...</span>
                </div>
              ) : ingredientDetails?.usedInRecipes && ingredientDetails.usedInRecipes.length > 0 ? (
                <div className="space-y-2">
                  {ingredientDetails.usedInRecipes.map((recipe, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium">{recipe.title}</h5>
                          <p className="text-sm text-muted-foreground">
                            Miktar: {recipe.quantity} {recipe.unit || ''}
                          </p>
                          {recipe.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Not: {recipe.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                          ID: {recipe.id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Bu malzeme henüz hiçbir tarifte kullanılmamış
                </div>
              )}
            </div>
          )}

          {/* Çeviriler */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Çeviriler</h4>
            
            {availableLanguages.map((language) => {
              const langCode = language.code
              const currentTranslation = formData.translations[langCode] || { name: '', description: '' }
              
              return (
                <div key={langCode} className="space-y-3 p-4 border rounded-lg">
                  <h5 className="font-medium text-sm text-blue-600">
                    {language.flag} {language.name}
                  </h5>
                  <div>
                    <Label htmlFor={`name_${langCode}`}>
                      {language.code === 'tr' ? 'Malzeme Adı' : 'Ingredient Name'} *
                    </Label>
                    <Input
                      id={`name_${langCode}`}
                      value={currentTranslation.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [langCode]: { 
                            ...prev.translations[langCode], 
                            name: e.target.value 
                          }
                        }
                      }))}
                      placeholder={language.code === 'tr' ? 'Malzeme adını girin' : 'Enter ingredient name'}
                      disabled={isViewMode}
                      required={!isViewMode}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`description_${langCode}`}>
                      {language.code === 'tr' ? 'Açıklama' : 'Description'}
                    </Label>
                    <Textarea
                      id={`description_${langCode}`}
                      value={currentTranslation.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        translations: {
                          ...prev.translations,
                          [langCode]: { 
                            ...prev.translations[langCode], 
                            description: e.target.value 
                          }
                        }
                      }))}
                      placeholder={language.code === 'tr' ? 'Malzeme açıklaması (opsiyonel)' : 'Ingredient description (optional)'}
                      rows={3}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Butonlar */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              {isViewMode ? 'Kapat' : 'İptal'}
            </Button>
            
            {!isViewMode && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    {isEditMode ? <Edit className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isEditMode ? 'Güncelle' : 'Ekle'}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
