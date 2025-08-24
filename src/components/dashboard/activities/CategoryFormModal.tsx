import { useState, useEffect } from 'react'
import type { ActivityCategory } from '@/api/types'
import { useActivities } from '@/contexts/ActivitiesContext'
import { useActivitiesApi } from '@/hooks/use-activities-api'
import { useLanguage } from '@/contexts/LanguageContext'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface CategoryFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ActivityCategory | null
  onSuccess: () => void
}

export function CategoryFormModal({ open, onOpenChange, category, onSuccess }: CategoryFormModalProps) {
  const { state } = useActivities()
  const { availableLanguages } = useLanguage()
  const { createCategory, updateCategory, getTranslation } = useActivitiesApi()

  // Form state
  const [formData, setFormData] = useState<{
    slug: string
    parent_id: number | null
    translations: { language_code: 'tr' | 'en'; name: string }[]
  }>({
    slug: '',
    parent_id: null,
    translations: [
      { language_code: 'tr', name: '' },
      { language_code: 'en', name: '' }
    ]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mevcut kategori varsa form'u doldur
  useEffect(() => {
    if (category && open) {
      const translations = state.categoryTranslations[category.id] || []
      
      setFormData({
        slug: category.slug,
        parent_id: category.parent_id || null,
        translations: availableLanguages.map(lang => {
          const existingTranslation = translations.find(t => t.language_code === lang.code)
          return {
            language_code: lang.code as 'tr' | 'en',
            name: existingTranslation?.name || ''
          }
        })
      })
    } else if (!category && open) {
      // Yeni kategori için form'u sıfırla
      setFormData({
        slug: '',
        parent_id: null,
        translations: [
          { language_code: 'tr', name: '' },
          { language_code: 'en', name: '' }
        ]
      })
    }
  }, [category, open, state.categoryTranslations, availableLanguages])

  // Form input değişikliklerini handle et
  const handleSlugChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      slug: value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    }))
  }

  const handleParentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      parent_id: value === 'null' ? null : parseInt(value)
    }))
  }

  const handleTranslationChange = (languageCode: 'tr' | 'en', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t => 
        t.language_code === languageCode ? { ...t, name: value } : t
      )
    }))
  }

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.slug.trim()) {
      alert('Slug girilmelidir')
      return
    }

    if (!formData.translations.some(t => t.name.trim())) {
      alert('En az bir dilde isim girilmelidir')
      return
    }

    setIsSubmitting(true)

    try {
      if (category) {
        // Güncelleme
        await updateCategory(category.id, {
          slug: formData.slug,
          parent_id: formData.parent_id === null ? undefined : formData.parent_id,
          translations: formData.translations.filter(t => t.name.trim())
        })
      } else {
        // Yeni oluşturma
        await createCategory({
          slug: formData.slug,
          parent_id: formData.parent_id === null ? undefined : formData.parent_id,
          translations: formData.translations.filter(t => t.name.trim())
        })
      }

      onSuccess()
    } catch (error) {
      console.error('Kategori kaydedilirken hata:', error)
      alert('Kategori kaydedilirken hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modal kapatıldığında form'u sıfırla
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        slug: '',
        parent_id: null,
        translations: [
          { language_code: 'tr', name: '' },
          { language_code: 'en', name: '' }
        ]
      })
    }
    onOpenChange(open)
  }

  // Ana kategorileri getir (parent_id null olanlar)
  const mainCategories = state.categories.filter(cat => !cat.parent_id)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </DialogTitle>
          <DialogDescription>
            Kategori bilgilerini ve çevirilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="evde, partnerle, romantik_seyler"
              required
            />
            <p className="text-xs text-muted-foreground">
              Sadece küçük harfler, rakamlar ve alt çizgi kullanın
            </p>
          </div>

          {/* Üst Kategori */}
          <div className="space-y-2">
            <Label htmlFor="parent">Üst Kategori</Label>
            <Select value={formData.parent_id?.toString() || 'null'} onValueChange={handleParentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Ana kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Ana Kategori</SelectItem>
                {mainCategories.map((cat) => {
                  const translations = state.categoryTranslations[cat.id] || []
                  const name = getTranslation(translations, 'name')
                  
                  return (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {name || 'İsimsiz'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Boş bırakırsanız ana kategori olur
            </p>
          </div>

          {/* Çeviriler */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Çeviriler</Label>
            
            {formData.translations.map((translation) => (
              <div key={translation.language_code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`name-${translation.language_code}`} className="text-sm font-medium">
                    {availableLanguages.find(l => l.code === translation.language_code)?.name}
                  </Label>
                  <Badge variant="outline">{translation.language_code.toUpperCase()}</Badge>
                </div>
                
                <Input
                  id={`name-${translation.language_code}`}
                  value={translation.name}
                  onChange={(e) => handleTranslationChange(translation.language_code, e.target.value)}
                  placeholder={`${availableLanguages.find(l => l.code === translation.language_code)?.name} isim`}
                  required
                />
              </div>
            ))}
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
              {isSubmitting ? 'Kaydediliyor...' : (category ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
