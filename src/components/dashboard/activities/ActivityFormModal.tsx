import { useState, useEffect } from 'react'
import type { Activity } from '@/api/types'
import { useActivities } from '@/contexts/ActivitiesContext'
import { useActivitiesApi } from '@/hooks/use-activities-api'
import { useLanguage } from '@/contexts/LanguageContext'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'


interface ActivityFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity?: Activity | null
  onSuccess: () => void
}

export function ActivityFormModal({ open, onOpenChange, activity, onSuccess }: ActivityFormModalProps) {
  const { state } = useActivities()
  const { availableLanguages } = useLanguage()
  const { createActivity, updateActivity, getTranslation } = useActivitiesApi()

  // Form state
  const [formData, setFormData] = useState<{
    translations: { language_code: 'tr' | 'en'; title: string; description: string }[]
    category_ids: number[]
  }>({
    translations: [
      { language_code: 'tr', title: '', description: '' },
      { language_code: 'en', title: '', description: '' }
    ],
    category_ids: []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mevcut aktivite varsa form'u doldur
  useEffect(() => {
    if (activity && open) {
      const translations = state.activityTranslations[activity.id] || []
      const categories = state.activityCategories[activity.id] || []
      
      setFormData({
        translations: availableLanguages.map(lang => {
          const existingTranslation = translations.find(t => t.language_code === lang.code)
          return {
            language_code: lang.code as 'tr' | 'en',
            title: existingTranslation?.title || '',
            description: existingTranslation?.description || ''
          }
        }),
        category_ids: categories.map(c => c.category_id)
      })
    } else if (!activity && open) {
      // Yeni aktivite için form'u sıfırla
      setFormData({
        translations: [
          { language_code: 'tr', title: '', description: '' },
          { language_code: 'en', title: '', description: '' }
        ],
        category_ids: []
      })
    }
  }, [activity, open, state.activityTranslations, state.activityCategories, availableLanguages])

  // Form input değişikliklerini handle et
  const handleTranslationChange = (languageCode: 'tr' | 'en', field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t => 
        t.language_code === languageCode ? { ...t, [field]: value } : t
      )
    }))
  }

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.translations.some(t => t.title.trim() && t.description.trim())) {
      alert('En az bir dilde başlık ve açıklama girilmelidir')
      return
    }

    setIsSubmitting(true)

    try {
      if (activity) {
        // Güncelleme
        await updateActivity(activity.id, {
          translations: formData.translations.filter(t => t.title.trim() && t.description.trim()),
          category_ids: formData.category_ids
        })
      } else {
        // Yeni oluşturma
        await createActivity({
          translations: formData.translations.filter(t => t.title.trim() && t.description.trim()),
          category_ids: formData.category_ids
        })
      }

      onSuccess()
    } catch (error) {
      console.error('Aktivite kaydedilirken hata:', error)
      alert('Aktivite kaydedilirken hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modal kapatıldığında form'u sıfırla
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        translations: [
          { language_code: 'tr', title: '', description: '' },
          { language_code: 'en', title: '', description: '' }
        ],
        category_ids: []
      })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activity ? 'Aktivite Düzenle' : 'Yeni Aktivite Ekle'}
          </DialogTitle>
          <DialogDescription>
            Aktivite bilgilerini ve çevirilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Çeviriler */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Çeviriler</Label>
            
            {formData.translations.map((translation) => (
              <div key={translation.language_code} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {availableLanguages.find(l => l.code === translation.language_code)?.name}
                  </Label>
                  <Badge variant="outline">{translation.language_code.toUpperCase()}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`title-${translation.language_code}`}>Başlık</Label>
                  <Input
                    id={`title-${translation.language_code}`}
                    value={translation.title}
                    onChange={(e) => handleTranslationChange(translation.language_code, 'title', e.target.value)}
                    placeholder={`${availableLanguages.find(l => l.code === translation.language_code)?.name} başlık`}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`description-${translation.language_code}`}>Açıklama</Label>
                  <Textarea
                    id={`description-${translation.language_code}`}
                    value={translation.description}
                    onChange={(e) => handleTranslationChange(translation.language_code, 'description', e.target.value)}
                    placeholder={`${availableLanguages.find(l => l.code === translation.language_code)?.name} açıklama`}
                    rows={3}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Kategoriler */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Kategoriler</Label>
            
            {state.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz kategori eklenmemiş</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {state.categories.map((category) => {
                  const translations = state.categoryTranslations[category.id] || []
                  const name = getTranslation(translations, 'name')
                  const isSelected = formData.category_ids.includes(category.id)
                  
                  return (
                    <div
                      key={category.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name || 'İsimsiz'}</span>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            Seçili
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Slug: {category.slug}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : (activity ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
