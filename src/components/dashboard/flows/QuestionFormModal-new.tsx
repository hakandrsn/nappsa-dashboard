import { useState, useEffect } from 'react'
import { useFlows } from '@/contexts/FlowsContext'
import { useFlowsApi } from '@/hooks/use-flows-api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FlowQuestion, CreateQuestionData } from '@/api/types'

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingQuestion?: FlowQuestion | null
}

export function QuestionFormModal({ isOpen, onClose, editingQuestion }: QuestionFormModalProps) {
  const { dispatch } = useFlows()
  const { createQuestion, updateQuestion } = useFlowsApi()
  const { toast } = useToast()

  const [formData, setFormData] = useState<CreateQuestionData>({
    slug: '',
    is_start_question: false,
    translations: [
      { language_code: 'tr', text: '' },
      { language_code: 'en', text: '' }
    ]
  })
  const [isLoading, setIsLoading] = useState(false)

  // Form verilerini sıfırla
  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        slug: editingQuestion.slug,
        is_start_question: editingQuestion.is_start_question,
        translations: [
          { language_code: 'tr', text: '' }, // Çevirileri API'den çekmen gerekir
          { language_code: 'en', text: '' }
        ]
      })
    } else {
      setFormData({
        slug: '',
        is_start_question: false,
        translations: [
          { language_code: 'tr', text: '' },
          { language_code: 'en', text: '' }
        ]
      })
    }
  }, [editingQuestion, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Dil zorunlu kontrolü
    const emptyTranslations = formData.translations.filter(t => !t.text.trim())
    if (emptyTranslations.length > 0) {
      toast({
        title: "Hata",
        description: "Tüm dillerde soru metni girmelisiniz.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (editingQuestion) {
        // Güncelleme
        const { data, error } = await updateQuestion(editingQuestion.id, {
          slug: formData.slug,
          is_start_question: formData.is_start_question
        })
        if (error) throw error

        dispatch({ type: 'UPDATE_QUESTION', payload: data })
        toast({
          title: "Başarılı",
          description: "Soru başarıyla güncellendi.",
        })
      } else {
        // Yeni oluşturma
        const { data, error } = await createQuestion(formData)
        if (error) throw error

        dispatch({ type: 'ADD_QUESTION', payload: data })
        toast({
          title: "Başarılı",
          description: "Soru başarıyla oluşturuldu.",
        })
      }

      onClose()
    } catch (error) {
      console.error('Question kaydedilirken hata:', error)
      toast({
        title: "Hata",
        description: "Soru kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranslationChange = (languageCode: 'tr' | 'en', text: string) => {
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
          <DialogTitle>
            {editingQuestion ? 'Soru Düzenle' : 'Yeni Soru Ekle'}
          </DialogTitle>
          <DialogDescription>
            Flow için soru oluşturun veya düzenleyin. Tüm dillerde metin girmelisiniz.
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_start_question"
              checked={formData.is_start_question}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_start_question: !!checked }))}
            />
            <Label htmlFor="is_start_question">Başlangıç Sorusu</Label>
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
            <Button type="submit" disabled={isLoading || !formData.slug.trim()}>
              {isLoading ? 'Kaydediliyor...' : (editingQuestion ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
