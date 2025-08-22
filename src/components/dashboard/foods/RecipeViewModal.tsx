import React from 'react'
import { X, Clock, Users, ChefHat, Utensils, Tag, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FoodRecipe, FoodRecipeTranslation, FoodIngredient, FoodCategory, FoodCuisine } from '@/api/types'

interface RecipeViewModalProps {
  recipe: FoodRecipe | null
  translations: FoodRecipeTranslation[]
  ingredients: Array<{
    ingredient: FoodIngredient & { name?: string }
    quantity: string
    unit: string
    notes?: string | undefined
  }>
  categories: (FoodCategory & { name?: string })[]
  cuisines: (FoodCuisine & { name?: string })[]
  ingredientTranslations: Record<number, Array<{ language_code: string; name: string; description?: string }>>
  isOpen: boolean
  onClose: () => void
  currentLanguage: string
}

export function RecipeViewModal({
  recipe,
  translations,
  ingredients,
  categories,
  cuisines,
  ingredientTranslations,
  isOpen,
  onClose,
  currentLanguage
}: RecipeViewModalProps) {
  if (!isOpen || !recipe) return null

  const currentTranslation = translations.find(t => t.language_code === currentLanguage) || translations[0]
  const otherTranslations = translations.filter(t => t.language_code !== currentLanguage)

  const formatTime = (minutes: number | null | undefined) => {
    if (!minutes) return 'Belirtilmemiş'
    if (minutes < 60) return `${minutes} dk`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tarif Detayları</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tarif Resmi */}
          {recipe.image_url && (
            <div className="text-center">
              <img 
                src={recipe.image_url} 
                alt={currentTranslation?.title || 'Tarif Resmi'}
                className="max-w-full h-64 object-cover rounded-lg mx-auto"
              />
            </div>
          )}

          {/* Ana Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentTranslation?.title || 'Başlık Yok'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Açıklama */}
              {currentTranslation?.description && (
                <p className="text-gray-600 leading-relaxed">
                  {currentTranslation.description}
                </p>
              )}

              {/* Özellikler */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Hazırlık:</span> {formatTime(recipe.prep_time_minutes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Pişirme:</span> {formatTime(recipe.cook_time_minutes)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Porsiyon:</span> {recipe.servings || 'Belirtilmemiş'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Zorluk:</span>
                  </span>
                  <Badge className={getDifficultyColor(recipe.difficulty || '')}>
                    {recipe.difficulty || 'Belirtilmemiş'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Malzemeler */}
          {ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Malzemeler ({ingredients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {ingredients.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-gray-800">
                          {(() => {
                            const translations = ingredientTranslations[item.ingredient.id] || []
                            const currentName = translations.find((t: { language_code: string; name: string; description?: string }) => t.language_code === currentLanguage)?.name
                            return currentName || item.ingredient.source_id || 'Malzeme adı bulunamadı'
                          })()}
                        </span>
                      </div>
                      {item.notes && (
                        <span className="text-xs text-gray-500 italic">
                          {item.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kategoriler */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Kategoriler ({categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                                     {categories.map((category) => (
                     <Badge key={category.id} variant="secondary">
                       {category.name || category.slug || 'Kategori adı bulunamadı'}
                     </Badge>
                   ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mutfaklar */}
          {cuisines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Mutfaklar ({cuisines.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                                     {cuisines.map((cuisine) => (
                     <Badge key={cuisine.id} variant="outline">
                       {cuisine.name || cuisine.slug || 'Mutfak adı bulunamadı'}
                     </Badge>
                   ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tarif Adımları */}
          {currentTranslation?.instructions && currentTranslation.instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tarif Adımları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentTranslation.instructions.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diğer Diller */}
          {otherTranslations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Diğer Diller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherTranslations.map((translation) => (
                    <div key={translation.language_code} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {translation.language_code === 'tr' ? '🇹🇷 Türkçe' : 
                           translation.language_code === 'en' ? '🇬🇧 English' : 
                           translation.language_code === 'de' ? '🇩🇪 Deutsch' : translation.language_code}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1">{translation.title}</h4>
                      {translation.description && (
                        <p className="text-sm text-gray-600">{translation.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </div>
  )
}
