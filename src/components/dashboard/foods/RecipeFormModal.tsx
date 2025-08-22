import { useState, useEffect } from 'react'
import type { FoodRecipe, FoodRecipeTranslation, CreateFoodRecipe, UpdateFoodRecipe } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { validateRecipeData, validateTranslationData, cleanRecipeData, cleanTranslationData } from '@/lib/foods-utils'
import { useFoodsApi } from '@/hooks/use-foods-api'
import { IngredientSelectionModal } from './IngredientSelectionModal'
import { MEASUREMENT_UNITS, getUnitLabel } from '@/lib/units'

import { useFoods } from '@/contexts/FoodsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { X, Plus, Trash2 } from 'lucide-react'

interface RecipeFormModalProps {
  isOpen: boolean
  onClose: () => void
  recipe?: FoodRecipe | null
  mode: 'create' | 'edit'
}

export function RecipeFormModal({ isOpen, onClose, recipe, mode }: RecipeFormModalProps) {
  const { state } = useFoods()
  const { createRecipe, updateRecipe, loading } = useFoodsApi()
  const { currentLanguage } = useLanguage()
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateFoodRecipe>>({
    image_url: '',
    prep_time_minutes: undefined,
    cook_time_minutes: undefined,
    servings: undefined,
    difficulty: 'Medium',
    cuisine_id: undefined
  })
  
  // Bağımlı alanlar için state
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    ingredient_id: number
    quantity: string
    unit: string
  }>>([])
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState<boolean>(false)
  
  const [translations, setTranslations] = useState<Partial<FoodRecipeTranslation>[]>([
    {
      language_code: 'tr',
      title: '',
      description: '',
      instructions: []
    }
  ])
  
  const [errors, setErrors] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('recipe')

  // Recipe varsa form'u doldur
  useEffect(() => {
    if (recipe && mode === 'edit') {
      setFormData({
        image_url: recipe.image_url || '',
        prep_time_minutes: recipe.prep_time_minutes || undefined,
        cook_time_minutes: recipe.cook_time_minutes || undefined,
        servings: recipe.servings || undefined,
        difficulty: recipe.difficulty || 'Medium',
        cuisine_id: recipe.cuisine_id || undefined
      })
      
      // Çevirileri yükle
      const recipeTranslations = state.recipeTranslations[recipe.id] || []
      if (recipeTranslations.length > 0) {
        setTranslations(recipeTranslations.map(t => ({
          language_code: t.language_code,
          title: t.title,
          description: t.description,
          instructions: t.instructions || []
        })))
      }
    }
  }, [recipe, mode, state.recipeTranslations, currentLanguage])

  // Malzeme seçim modal'ını aç
  const openIngredientModal = () => {
    setIsIngredientModalOpen(true)
  }

  // Malzeme seçildiğinde
  const handleIngredientSelect = (result: { ingredient: any; translation: any }) => {
    setSelectedIngredients(prev => [...prev, {
      ingredient_id: result.ingredient.id,
      quantity: '',
      unit: ''
    }])
  }

  // Form değişikliklerini handle et
  const handleFormChange = (field: keyof CreateFoodRecipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Çeviri değişikliklerini handle et
  const handleTranslationChange = (index: number, field: keyof FoodRecipeTranslation, value: any) => {
    setTranslations(prev => 
      prev.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    )
  }

  // Yeni çeviri ekle
  const addTranslation = () => {
    setTranslations(prev => [
      ...prev,
      {
        language_code: 'tr',
        title: '',
        description: '',
        instructions: []
      }
    ])
  }

  // Çeviri sil
  const removeTranslation = (index: number) => {
    if (translations.length > 1) {
      setTranslations(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Talimat ekle
  const addInstruction = (translationIndex: number) => {
    setTranslations(prev => 
      prev.map((t, i) => 
        i === translationIndex 
          ? { ...t, instructions: [...(t.instructions || []), ''] }
          : t
      )
    )
  }

  // Talimat değiştir
  const updateInstruction = (translationIndex: number, instructionIndex: number, value: string) => {
    setTranslations(prev => 
      prev.map((t, i) => 
        i === translationIndex 
          ? { 
              ...t, 
              instructions: (t.instructions || []).map((inst, j) => 
                j === instructionIndex ? value : inst
              )
            }
          : t
      )
    )
  }

  // Talimat sil
  const removeInstruction = (translationIndex: number, instructionIndex: number) => {
    setTranslations(prev => 
      prev.map((t, i) => 
        i === translationIndex 
          ? { 
              ...t, 
              instructions: (t.instructions || []).filter((_, j) => j !== instructionIndex)
            }
          : t
      )
    )
  }

  // Form'u gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasyon
    const recipeErrors = validateRecipeData(formData)
    const translationErrors: string[] = []
    
    translations.forEach((translation, index) => {
      const errors = validateTranslationData(translation, 'recipe')
      if (errors.length > 0) {
        translationErrors.push(`Çeviri ${index + 1}: ${errors.join(', ')}`)
      }
    })
    
    const allErrors = [...recipeErrors, ...translationErrors]
    if (allErrors.length > 0) {
      setErrors(allErrors)
      return
    }
    
    try {
      const cleanedFormData = cleanRecipeData(formData)
      const cleanedTranslations = translations.map(t => cleanTranslationData(t))
      
      if (mode === 'create') {
        await createRecipe(cleanedFormData as CreateFoodRecipe, cleanedTranslations as any[])
      } else if (recipe) {
        await updateRecipe(recipe.id, cleanedFormData as UpdateFoodRecipe, cleanedTranslations as any[])
      }
      
      onClose()
      resetForm()
    } catch (error) {
      console.error('Tarif kaydedilirken hata:', error)
    }
  }

  // Form'u sıfırla
  const resetForm = () => {
    setFormData({
      image_url: '',
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      servings: undefined,
      difficulty: 'Medium',
      cuisine_id: undefined
    })
    setSelectedCategories([])
    setSelectedTags([])
    setSelectedIngredients([])
    setTranslations([
      {
        language_code: 'tr',
        title: '',
        description: '',
        instructions: []
      }
    ])
    setErrors([])
    setActiveTab('recipe')
  }

  // Modal kapanırken form'u sıfırla
  const handleClose = () => {
    resetForm()
    onClose()
  }



  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Yeni Tarif Ekle' : 'Tarifi Düzenle'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Yeni bir tarif ekleyin ve çevirilerini yapın.' 
              : 'Mevcut tarifi düzenleyin ve çevirilerini güncelleyin.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recipe">Tarif Bilgileri</TabsTrigger>
              <TabsTrigger value="translations">Çeviriler</TabsTrigger>
            </TabsList>

            {/* Tarif Bilgileri Tab */}
            <TabsContent value="recipe" className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Temel Bilgiler</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Resim URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url || ''}
                      onChange={(e) => handleFormChange('image_url', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuisine_id">Mutfak</Label>
                    <Select
                      value={formData.cuisine_id?.toString() || ''}
                      onValueChange={(value) => handleFormChange('cuisine_id', parseInt(value) || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mutfak seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.cuisines.map((cuisine) => {
                          const translation = state.cuisineTranslations[cuisine.id]?.find(t => t.language_code === currentLanguage)
                          return (
                            <SelectItem key={cuisine.id} value={cuisine.id.toString()}>
                              {translation?.name || 'Ad Yok'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prep_time_minutes">Hazırlık Süresi (dk)</Label>
                    <Input
                      id="prep_time_minutes"
                      type="number"
                      min="0"
                      placeholder="30"
                      value={formData.prep_time_minutes || ''}
                      onChange={(e) => handleFormChange('prep_time_minutes', parseInt(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cook_time_minutes">Pişirme Süresi (dk)</Label>
                    <Input
                      id="cook_time_minutes"
                      type="number"
                      min="0"
                      placeholder="45"
                      value={formData.cook_time_minutes || ''}
                      onChange={(e) => handleFormChange('cook_time_minutes', parseInt(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="servings">Porsiyon Sayısı</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      placeholder="4"
                      value={formData.servings || ''}
                      onChange={(e) => handleFormChange('servings', parseInt(e.target.value) || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Zorluk</Label>
                    <Select
                      value={formData.difficulty || 'Medium'}
                      onValueChange={(value) => handleFormChange('difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Zorluk seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Kategoriler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Kategoriler</h4>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {state.categories.map((category) => {
                      const translation = state.categoryTranslations[category.id]?.find(t => t.language_code === currentLanguage)
                      const isSelected = selectedCategories.includes(category.id)
                      return (
                        <Button
                          key={category.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategories(prev => prev.filter(id => id !== category.id))
                            } else {
                              setSelectedCategories(prev => [...prev, category.id])
                            }
                          }}
                        >
                          {translation?.name || 'Ad Yok'}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seçili: {selectedCategories.length} kategori
                  </p>
                </div>
              </div>

              {/* Etiketler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Etiketler</h4>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {state.tags.map((tag) => {
                      const translation = state.tagTranslations[tag.id]?.find(t => t.language_code === currentLanguage)
                      const isSelected = selectedTags.includes(tag.id)
                      return (
                        <Button
                          key={tag.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags(prev => prev.filter(id => id !== tag.id))
                            } else {
                              setSelectedTags(prev => [...prev, tag.id])
                            }
                          }}
                        >
                          {translation?.name || 'Ad Yok'}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Seçili: {selectedTags.length} etiket
                  </p>
                </div>
              </div>

              {/* Malzemeler */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Malzemeler</h4>
                <div className="space-y-3">
                  {selectedIngredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {(() => {
                            const ingredientData = state.ingredients.find(ing => ing.id === ingredient.ingredient_id)
                            if (!ingredientData) return 'Seçilmedi'
                            
                            // Çeviriyi bul
                            const translation = state.ingredientTranslations[ingredient.ingredient_id]?.find(
                              t => t.language_code === currentLanguage
                            )
                            
                            return translation?.name || `Malzeme #${ingredient.ingredient_id}`
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {ingredient.ingredient_id}
                          {ingredient.unit && (
                            <span className="ml-2 text-blue-600">
                              • Birim: {getUnitLabel(ingredient.unit)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Input
                        type="text"
                        placeholder="Miktar"
                        value={ingredient.quantity}
                        onChange={(e) => {
                          const newIngredients = [...selectedIngredients]
                          newIngredients[index].quantity = e.target.value
                          setSelectedIngredients(newIngredients)
                        }}
                        className="w-24"
                      />
                      
                      <Select
                        value={ingredient.unit || ''}
                        onValueChange={(value) => {
                          const newIngredients = [...selectedIngredients]
                          newIngredients[index].unit = value
                          setSelectedIngredients(newIngredients)
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Birim" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {/* Kategorilere göre grupla */}
                          {Object.entries({
                            '⚖️ Ağırlık': MEASUREMENT_UNITS.filter(u => u.category === 'weight'),
                            '🥤 Hacim': MEASUREMENT_UNITS.filter(u => u.category === 'volume'),
                            '🔢 Adet': MEASUREMENT_UNITS.filter(u => u.category === 'count'),
                            '📏 Uzunluk': MEASUREMENT_UNITS.filter(u => u.category === 'length'),
                            '✨ Özel': MEASUREMENT_UNITS.filter(u => u.category === 'special')
                          }).map(([category, units]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 bg-gray-100 border-b">
                                {category}
                              </div>
                              {units.map((unit) => (
                                <SelectItem key={unit.value} value={unit.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{unit.label}</span>
                                    {unit.value !== unit.label && (
                                      <span className="text-xs text-gray-400">
                                        ({unit.value})
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIngredients(prev => prev.filter((_, i) => i !== index))
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openIngredientModal}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Malzeme Ekle
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Çeviriler Tab */}
            <TabsContent value="translations" className="space-y-4">
              <div className="space-y-4">
                {translations.map((translation, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Çeviri {index + 1}</h4>
                      {translations.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTranslation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`lang_${index}`}>Dil Kodu</Label>
                        <Input
                          id={`lang_${index}`}
                          placeholder="tr"
                          value={translation.language_code || ''}
                          onChange={(e) => handleTranslationChange(index, 'language_code', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`title_${index}`}>Başlık</Label>
                      <Input
                        id={`title_${index}`}
                        placeholder="Tarif başlığı"
                        value={translation.title || ''}
                        onChange={(e) => handleTranslationChange(index, 'title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`desc_${index}`}>Açıklama</Label>
                      <Textarea
                        id={`desc_${index}`}
                        placeholder="Tarif açıklaması"
                        value={translation.description || ''}
                        onChange={(e) => handleTranslationChange(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Talimatlar</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addInstruction(index)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Talimat Ekle
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {(translation.instructions || []).map((instruction, instIndex) => (
                          <div key={instIndex} className="flex gap-2">
                            <Input
                              placeholder={`Talimat ${instIndex + 1}`}
                              value={instruction}
                              onChange={(e) => updateInstruction(index, instIndex, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInstruction(index, instIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTranslation}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Çeviri Ekle
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Hatalar */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive mb-2">Hatalar:</h4>
              <ul className="text-sm text-destructive space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (mode === 'create' ? 'Oluştur' : 'Güncelle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Malzeme Seçim Modal'ı */}
      <IngredientSelectionModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onSelect={handleIngredientSelect}
        selectedIngredients={selectedIngredients}
      />
    </Dialog>
  )
}
