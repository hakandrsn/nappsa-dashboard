import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuestionFormModal({ isOpen, onClose }: QuestionFormModalProps) {
  const { availableLanguages } = useLanguage()
  const [formData, setFormData] = useState({
    slug: '',
    translations: availableLanguages.map(lang => ({
      language_code: lang,
      text: ''
    }))
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement question creation
    console.log('Question form submitted:', formData)
    onClose()
  }

  const handleTranslationChange = (languageCode: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t => 
        t.language_code === languageCode ? { ...t, text } : t
      )
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Soru Ekle</DialogTitle>
          <DialogDescription>
            Flow için yeni bir soru oluşturun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slug">Soru Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="soru_slug_ornegi"
              required
            />
          </div>

          {formData.translations.map((translation) => (
            <div key={translation.language_code} className="space-y-2">
              <Label htmlFor={`text_${translation.language_code}`}>
                Soru Metni ({translation.language_code.toUpperCase()}) *
              </Label>
              <Textarea
                id={`text_${translation.language_code}`}
                value={translation.text}
                onChange={(e) => handleTranslationChange(translation.language_code, e.target.value)}
                placeholder={`Soru metnini ${translation.language_code.toUpperCase()} dilinde girin`}
                rows={2}
                required
              />
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={!formData.slug.trim()}>
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
