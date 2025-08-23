import { useState, useEffect } from 'react'
import { useFlows } from '@/contexts/FlowsContext'
import { useFlowsApi } from '@/hooks/use-flows-api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FlowAnswer, CreateAnswerData } from '@/api/types'
import { supabase } from '@/api/supabase'

interface AnswerFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingAnswer?: FlowAnswer | null
  questionId: number
}

export function AnswerFormModal({ isOpen, onClose, editingAnswer, questionId }: AnswerFormModalProps) {
  const { state, dispatch } = useFlows()
  const { createAnswer, updateAnswer } = useFlowsApi()
  const { toast } = useToast()

  const availableLanguages = ['tr', 'en']

  const [formData, setFormData] = useState<CreateAnswerData>({
    question_id: questionId,
    next_question_id: undefined,
    action_id: undefined,
    translations: [
      { language_code: 'tr', text: '' },
      { language_code: 'en', text: '' }
    ]
  })
  const [selectedType, setSelectedType] = useState<'question' | 'action'>('question')
  const [isLoading, setIsLoading] = useState(false)

  // Form verilerini sıfırla
  useEffect(() => {
    if (editingAnswer) {
      // Mevcut cevabın çevirilerini yükle
      loadAnswerTranslations(editingAnswer.id)
      
      setFormData({
        question_id: questionId,
        next_question_id: editingAnswer.next_question_id || undefined,
        action_id: editingAnswer.action_id || undefined,
        translations: [
          { language_code: 'tr', text: '' },
          { language_code: 'en', text: '' }
        ]
      })
    } else {
      setFormData({
        question_id: questionId,
        next_question_id: undefined,
        action_id: undefined,
        translations: [
          { language_code: 'tr', text: '' },
          { language_code: 'en', text: '' }
        ]
      })
    }
  }, [editingAnswer, questionId, isOpen])

  // Cevap çevirilerini yükle
  const loadAnswerTranslations = async (answerId: number) => {
    try {
      const { data, error } = await supabase
        .from('flow_answer_translations')
        .select('*')
        .eq('answer_id', answerId)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Mevcut çevirileri formData'ya yükle
        const translations = availableLanguages.map((lang: string) => {
          const existingTranslation = data.find((t: any) => t.language_code === lang)
          return {
            language_code: lang as 'tr' | 'en',
            text: existingTranslation?.text || ''
          }
        })
        
        setFormData(prev => ({
          ...prev,
          translations
        }))
      }
    } catch (error) {
      console.error('Çeviriler yüklenirken hata:', error)
      toast({
        title: "Hata",
        description: "Çeviriler yüklenirken hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Dil zorunlu kontrolü
    const emptyTranslations = formData.translations.filter(t => !t.text.trim())
    if (emptyTranslations.length > 0) {
      toast({
        title: "Hata",
        description: "Tüm dillerde cevap metni girmelisiniz.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // next_question_id veya action_id kontrolü
    if (selectedType === 'question' && !formData.next_question_id) {
      toast({
        title: "Hata",
        description: "Lütfen bir sonraki soruyu seçin.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (selectedType === 'action' && !formData.action_id) {
      toast({
        title: "Hata",
        description: "Lütfen bir action seçin.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (editingAnswer) {
        // Güncelleme - önce ana cevabı güncelle
        const { data, error } = await updateAnswer(editingAnswer.id, {
          question_id: formData.question_id,
          next_question_id: formData.next_question_id,
          action_id: formData.action_id
        })
        if (error) throw error

        // Sonra çevirileri güncelle - önce sil, sonra ekle
        for (const translation of formData.translations) {
          // Önce mevcut çeviriyi sil
          const { error: deleteError } = await supabase
            .from('flow_answer_translations')
            .delete()
            .eq('answer_id', editingAnswer.id)
            .eq('language_code', translation.language_code)
          
          if (deleteError) {
            console.error('Çeviri silinirken hata:', deleteError)
            throw new Error(`Çeviri silinirken hata: ${deleteError.message}`)
          }

          // Sonra yeni çeviriyi ekle
          const { error: insertError } = await supabase
            .from('flow_answer_translations')
            .insert({
              answer_id: editingAnswer.id,
              language_code: translation.language_code,
              text: translation.text
            })
          
          if (insertError) {
            console.error('Çeviri eklenirken hata:', insertError)
            throw new Error(`Çeviri eklenirken hata: ${insertError.message}`)
          }
        }

        dispatch({ type: 'UPDATE_ANSWER', payload: data })
        toast({
          title: "Başarılı",
          description: "Cevap ve çeviriler başarıyla güncellendi.",
        })
      } else {
        // Yeni oluşturma - createAnswer API'si zaten çevirileri ekliyor
        const { data, error } = await createAnswer(formData)
        if (error) throw error

        dispatch({ type: 'ADD_ANSWER', payload: data })
        toast({
          title: "Başarılı",
          description: "Cevap ve çeviriler başarıyla oluşturuldu.",
        })
      }

      onClose()
    } catch (error) {
      console.error('Answer kaydedilirken hata:', error)
      toast({
        title: "Hata",
        description: "Cevap kaydedilirken bir hata oluştu.",
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

  const handleNextStepChange = (type: 'question' | 'action', value: string) => {
    if (type === 'question') {
      setFormData(prev => ({
        ...prev,
        next_question_id: value ? parseInt(value) : undefined,
        action_id: undefined // Diğerini sıfırla
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        action_id: value ? parseInt(value) : undefined,
        next_question_id: undefined // Diğerini sıfırla
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingAnswer ? 'Cevap Düzenle' : 'Yeni Cevap Ekle'}
          </DialogTitle>
          <DialogDescription>
            Bu cevap seçildiğinde ne olacağını belirleyin. Ya bir sonraki soruya gidecek ya da bir action tetikleyecek.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sonraki Adım Seçimi */}
          <div className="space-y-3">
            <Label>Sonraki Adım</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="next-question"
                  name="step-type"
                  value="question"
                  checked={selectedType === 'question'}
                  onChange={() => {
                    setSelectedType('question')
                    setFormData(prev => ({ ...prev, action_id: undefined }))
                  }}
                />
                <Label htmlFor="next-question">Sonraki Soruya Git</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="trigger-action"
                  name="step-type"
                  value="action"
                  checked={selectedType === 'action'}
                  onChange={() => {
                    setSelectedType('action')
                    setFormData(prev => ({ ...prev, next_question_id: undefined }))
                  }}
                />
                <Label htmlFor="trigger-action">Action Tetikle</Label>
              </div>
            </div>
          </div>

          {/* Sonraki Soru Seçimi */}
          {selectedType === 'question' && (
            <div className="space-y-2">
              <Label htmlFor="next-question-select">Sonraki Soru</Label>
              <Select 
                value={formData.next_question_id?.toString() || ''} 
                onValueChange={(value) => handleNextStepChange('question', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sonraki soruyu seçin" />
                </SelectTrigger>
                <SelectContent>
                  {state.questions
                    .filter(q => q.id !== questionId) // Kendisi hariç
                    .map(question => (
                      <SelectItem key={question.id} value={question.id.toString()}>
                        {question.slug}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Seçimi */}
          {selectedType === 'action' && (
            <div className="space-y-2">
              <Label htmlFor="action-select">Action</Label>
              <Select 
                value={formData.action_id?.toString() || ''} 
                onValueChange={(value) => handleNextStepChange('action', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action seçin" />
                </SelectTrigger>
                <SelectContent>
                  {state.actions.map(action => (
                    <SelectItem key={action.id} value={action.id.toString()}>
                      {action.description} ({action.action_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Çeviriler */}
          {formData.translations.map((translation) => (
            <div key={translation.language_code} className="space-y-2">
              <Label htmlFor={`text_${translation.language_code}`}>
                Cevap Metni ({translation.language_code.toUpperCase()}) *
              </Label>
              <Textarea
                id={`text_${translation.language_code}`}
                value={translation.text}
                onChange={(e) => handleTranslationChange(translation.language_code, e.target.value)}
                placeholder={`Cevap metnini ${translation.language_code.toUpperCase()} dilinde girin`}
                rows={2}
                required
              />
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading || !formData.translations.every(t => t.text.trim())}>
              {isLoading ? 'Kaydediliyor...' : (editingAnswer ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
