import { useState, useEffect } from 'react'
import { useFlows } from '@/contexts/FlowsContext'
import { useFlowsApi } from '@/hooks/use-flows-api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ACTION_TYPES, type ActionType } from '@/api/types'
import type { FlowAction, CreateActionData } from '@/api/types'

interface ActionFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingAction?: FlowAction | null
}

export function ActionFormModal({ isOpen, onClose, editingAction }: ActionFormModalProps) {
  const { dispatch } = useFlows()
  const { createAction, updateAction } = useFlowsApi()
  const { toast } = useToast()

  const [formData, setFormData] = useState<CreateActionData>({
    description: '',
    action_type: 'SHOW_CUSTOM_MESSAGE' as ActionType,
    parameters: {}
  })
  const [isLoading, setIsLoading] = useState(false)

  // Form verilerini sıfırla
  useEffect(() => {
    if (editingAction) {
      setFormData({
        description: editingAction.description,
        action_type: editingAction.action_type as ActionType,
        parameters: editingAction.parameters || {}
      })
    } else {
      setFormData({
        description: '',
        action_type: '' as ActionType,
        parameters: {}
      })
    }
  }, [editingAction, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingAction) {
        // Güncelleme
        const { data, error } = await updateAction(editingAction.id, formData)
        if (error) throw error

        dispatch({ type: 'UPDATE_ACTION', payload: data })
        toast({
          title: "Başarılı",
          description: "Action başarıyla güncellendi.",
        })
      } else {
        // Yeni oluşturma
        const { data, error } = await createAction(formData)
        if (error) throw error

        dispatch({ type: 'ADD_ACTION', payload: data })
        toast({
          title: "Başarılı",
          description: "Action başarıyla oluşturuldu.",
        })
      }

      onClose()
    } catch (error) {
      console.error('Action kaydedilirken hata:', error)
      toast({
        title: "Hata",
        description: "Action kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleParameterChange = (key: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value
      }
    }))
  }

  const renderParameterFields = () => {
    switch (formData.action_type) {
      case 'FETCH_RANDOM_RECIPE':
        return (
          <div className="space-y-2">
            <Label htmlFor="table_name">Tablo Adı</Label>
            <Input
              id="table_name"
              value={formData.parameters.table_name || ''}
              onChange={(e) => handleParameterChange('table_name', e.target.value)}
              placeholder="food_recipes"
            />
          </div>
        )

      case 'FETCH_RECIPE_BY_CUISINE':
        return (
          <div className="space-y-2">
            <Label htmlFor="cuisine_slug">Mutfak Slug</Label>
            <Input
              id="cuisine_slug"
              value={formData.parameters.cuisine_slug || ''}
              onChange={(e) => handleParameterChange('cuisine_slug', e.target.value)}
              placeholder="turkish"
            />
          </div>
        )

      case 'FETCH_MOVIE_BY_GENRE':
        return (
          <div className="space-y-2">
            <Label htmlFor="genre_slug">Film Türü Slug</Label>
            <Input
              id="genre_slug"
              value={formData.parameters.genre_slug || ''}
              onChange={(e) => handleParameterChange('genre_slug', e.target.value)}
              placeholder="action"
            />
          </div>
        )

      case 'SHOW_CUSTOM_MESSAGE':
        return (
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj</Label>
            <Textarea
              id="message"
              value={formData.parameters.message || ''}
              onChange={(e) => handleParameterChange('message', e.target.value)}
              placeholder="Gösterilecek mesajı girin"
              rows={3}
            />
          </div>
        )

      case 'REDIRECT_TO_URL':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.parameters.url || ''}
              onChange={(e) => handleParameterChange('url', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        )

      case 'OPEN_MODAL':
        return (
          <div className="space-y-2">
            <Label htmlFor="modal_content">Modal İçeriği</Label>
            <Textarea
              id="modal_content"
              value={formData.parameters.modal_content || ''}
              onChange={(e) => handleParameterChange('modal_content', e.target.value)}
              placeholder="Modal'da gösterilecek içerik"
              rows={3}
            />
          </div>
        )

      case 'CALL_API_ENDPOINT':
        return (
          <div className="space-y-2">
            <Label htmlFor="api_endpoint">API Endpoint</Label>
            <Input
              id="api_endpoint"
              value={formData.parameters.api_endpoint || ''}
              onChange={(e) => handleParameterChange('api_endpoint', e.target.value)}
              placeholder="/api/endpoint"
            />
          </div>
        )

      case 'FETCH_USER_PROFILE':
        return (
          <div className="space-y-2">
            <Label htmlFor="include_avatar">Avatar Dahil Et</Label>
            <Select
              value={formData.parameters.include_avatar?.toString() || 'false'}
              onValueChange={(value) => handleParameterChange('include_avatar', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Evet</SelectItem>
                <SelectItem value="false">Hayır</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'FETCH_WEATHER':
        return (
          <div className="space-y-2">
            <Label htmlFor="city">Şehir</Label>
            <Input
              id="city"
              value={formData.parameters.city || ''}
              onChange={(e) => handleParameterChange('city', e.target.value)}
              placeholder="Istanbul"
            />
            <Label htmlFor="units">Birim</Label>
            <Select
              value={formData.parameters.units || 'metric'}
              onValueChange={(value) => handleParameterChange('units', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Celsius</SelectItem>
                <SelectItem value="imperial">Fahrenheit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )

      case 'FETCH_NEWS':
        return (
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={formData.parameters.category || ''}
              onChange={(e) => handleParameterChange('category', e.target.value)}
              placeholder="technology"
            />
            <Label htmlFor="limit">Limit</Label>
            <Input
              id="limit"
              type="number"
              value={formData.parameters.limit || 5}
              onChange={(e) => handleParameterChange('limit', parseInt(e.target.value))}
              placeholder="5"
            />
          </div>
        )

      case 'FETCH_MUSIC_RECOMMENDATION':
        return (
          <div className="space-y-2">
            <Label htmlFor="genre">Müzik Türü</Label>
            <Input
              id="genre"
              value={formData.parameters.genre || ''}
              onChange={(e) => handleParameterChange('genre', e.target.value)}
              placeholder="pop"
            />
            <Label htmlFor="mood">Ruh Hali</Label>
            <Input
              id="mood"
              value={formData.parameters.mood || ''}
              onChange={(e) => handleParameterChange('mood', e.target.value)}
              placeholder="happy"
            />
          </div>
        )

      case 'FETCH_EXERCISE_SUGGESTION':
        return (
          <div className="space-y-2">
            <Label htmlFor="difficulty">Zorluk</Label>
            <Select
              value={formData.parameters.difficulty || 'beginner'}
              onValueChange={(value) => handleParameterChange('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Başlangıç</SelectItem>
                <SelectItem value="intermediate">Orta</SelectItem>
                <SelectItem value="advanced">İleri</SelectItem>
              </SelectContent>
            </Select>
            <Label htmlFor="duration">Süre (dakika)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.parameters.duration || 30}
              onChange={(e) => handleParameterChange('duration', parseInt(e.target.value))}
              placeholder="30"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingAction ? 'Action Düzenle' : 'Yeni Action Ekle'}
          </DialogTitle>
          <DialogDescription>
            Flow için yeni bir action oluşturun veya düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Action'ın ne yaptığını açıklayın"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_type">Action Tipi *</Label>
            <Select
              value={formData.action_type}
              onValueChange={(value: ActionType) => setFormData(prev => ({ ...prev, action_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action tipini seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {key.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.action_type && renderParameterFields()}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading || !formData.description.trim() || !formData.action_type}>
              {isLoading ? 'Kaydediliyor...' : (editingAction ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
