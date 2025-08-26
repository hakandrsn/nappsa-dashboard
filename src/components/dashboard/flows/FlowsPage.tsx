import { useState, useEffect } from 'react'
import { useFlows, FlowsProvider } from '@/contexts/FlowsContext'
import { useFlowsApi } from '@/hooks/use-flows-api'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/api/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  GitBranch, 
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { QuestionFormModal } from './QuestionFormModal'
import { AnswerFormModal } from './AnswerFormModal'
import { ActionFormModal } from './ActionFormModal'
import type { FlowAnswer } from '@/api/types'

function FlowsPageContent() {
  const { state, dispatch } = useFlows()
  const { toast } = useToast()
  const { 
    fetchQuestions, 
    fetchAnswers,
    fetchActions,
    deleteQuestion,
    deleteAnswer,
    deleteAction
  } = useFlowsApi()

  // Modal states
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<FlowAnswer | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState(null)
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('')

  // Test states
  const [testLanguage, setTestLanguage] = useState<'tr' | 'en'>('tr')
  const [testQuestionId, setTestQuestionId] = useState<number | null>(null)
  const [testAnswerId, setTestAnswerId] = useState<number | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [startQuestionResult, setStartQuestionResult] = useState<any>(null)
  const [questionResult, setQuestionResult] = useState<any>(null)
  const [nextStepResult, setNextStepResult] = useState<any>(null)
  const [testResults, setTestResults] = useState<Array<{
    name: string
    description: string
    success: boolean
    data?: any
  }>>([])

  // Preview states
  const [previewLanguage, setPreviewLanguage] = useState<'tr' | 'en'>('tr')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [currentFlowStep, setCurrentFlowStep] = useState<any>(null)
  const [flowResult, setFlowResult] = useState<any>(null)
  const [flowHistory, setFlowHistory] = useState<Array<{
    text: string
    selectedAnswer?: string
  }>>([])

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        const [questionsResult, answersResult, actionsResult] = await Promise.all([
          fetchQuestions(),
          fetchAnswers(),
          fetchActions()
        ])
        
        if (questionsResult.data) {
          dispatch({ type: 'SET_QUESTIONS', payload: questionsResult.data })
        }
        
        if (answersResult.data) {
          dispatch({ type: 'SET_ANSWERS', payload: answersResult.data })
        }
        
        if (actionsResult.data) {
          dispatch({ type: 'SET_ACTIONS', payload: actionsResult.data })
        }
        
      } catch (error) {
        console.error('Veriler yüklenirken hata:', error)
        toast({
          title: "Hata",
          description: "Veriler yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadInitialData()
  }, [])

  // Question işlemleri
  const handleCreateQuestion = () => {
    setEditingQuestion(null)
    setIsQuestionModalOpen(true)
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsQuestionModalOpen(true)
  }

  const handleDeleteQuestion = async (questionId: number) => {
    if (confirm('Bu soruyu silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await deleteQuestion(questionId)
        if (error) throw error
        
        dispatch({ type: 'DELETE_QUESTION', payload: questionId })
        toast({
          title: "Başarılı",
          description: "Soru başarıyla silindi.",
        })
      } catch (error) {
        console.error('Soru silinirken hata:', error)
        toast({
          title: "Hata",
          description: "Soru silinirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }
  }

  // Answer işlemleri
  const handleCreateAnswer = (questionId: number) => {
    setEditingAnswer(null)
    setSelectedQuestionId(questionId)
    setIsAnswerModalOpen(true)
  }

  const handleEditAnswer = (answer: FlowAnswer) => {
    setEditingAnswer(answer)
    setSelectedQuestionId(answer.question_id)
    setIsAnswerModalOpen(true)
  }

  const handleDeleteAnswer = async (answerId: number) => {
    if (confirm('Bu cevabı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await deleteAnswer(answerId)
        if (error) throw error
        
        dispatch({ type: 'DELETE_ANSWER', payload: answerId })
        toast({
          title: "Başarılı",
          description: "Cevap başarıyla silindi.",
        })
      } catch (error) {
        console.error('Cevap silinirken hata:', error)
        toast({
          title: "Hata",
          description: "Cevap silinirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAnswerModalClose = () => {
    setIsAnswerModalOpen(false)
    setEditingAnswer(null)
    // Sayfayı yenile
    fetchAnswers()
  }

  // Action işlemleri
  const handleCreateAction = () => {
    setEditingAction(null)
    setIsActionModalOpen(true)
  }

  const handleEditAction = (action: any) => {
    setEditingAction(action)
    setIsActionModalOpen(true)
  }

  const handleDeleteAction = async (actionId: number) => {
    if (confirm('Bu action\'ı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await deleteAction(actionId)
        if (error) throw error
        
        dispatch({ type: 'DELETE_ACTION', payload: actionId })
        toast({
          title: "Başarılı",
          description: "Action başarıyla silindi.",
        })
      } catch (error) {
        console.error('Action silinirken hata:', error)
        toast({
          title: "Hata",
          description: "Action silinirken bir hata oluştu.",
          variant: "destructive",
        })
      }
    }
  }

  // Tab değiştiğinde
  const handleTabChange = (value: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: value as any })
  }

  // Test fonksiyonları
  const testStartQuestion = async () => {
    setIsTesting(true)
    try {
      const { data, error } = await supabase.rpc('get_flow_start_question', {
        p_language_code: testLanguage
      })
      
      if (error) throw error
      
      setStartQuestionResult(data)
      setTestResults(prev => [...prev, {
        name: 'Başlangıç Sorusu Testi',
        description: `${testLanguage.toUpperCase()} dilinde başlangıç sorusu başarıyla getirildi`,
        success: true,
        data
      }])
      
      toast({
        title: "Başarılı",
        description: "Başlangıç sorusu test edildi.",
      })
    } catch (error) {
      console.error('Başlangıç sorusu test hatası:', error)
      setTestResults(prev => [...prev, {
        name: 'Başlangıç Sorusu Testi',
        description: `Hata: ${error}`,
        success: false,
        data: error
      }])
      
      toast({
        title: "Hata",
        description: "Başlangıç sorusu test edilirken hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const testGetQuestion = async () => {
    if (!testQuestionId) return
    
    setIsTesting(true)
    try {
      const { data, error } = await supabase.rpc('get_flow_question', {
        p_question_id: testQuestionId,
        p_language_code: testLanguage
      })
      
      if (error) throw error
      
      setQuestionResult(data)
      setTestResults(prev => [...prev, {
        name: 'Soru Getirme Testi',
        description: `Soru ${testQuestionId} ${testLanguage.toUpperCase()} dilinde başarıyla getirildi`,
        success: true,
        data
      }])
      
      toast({
        title: "Başarılı",
        description: "Soru test edildi.",
      })
    } catch (error) {
      console.error('Soru test hatası:', error)
      setTestResults(prev => [...prev, {
        name: 'Soru Getirme Testi',
        description: `Hata: ${error}`,
        success: false,
        data: error
      }])
      
      toast({
        title: "Hata",
        description: "Soru test edilirken hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const testNextStep = async () => {
    if (!testAnswerId) return
    
    setIsTesting(true)
    try {
      const { data, error } = await supabase.rpc('get_flow_next_step', {
        p_answer_id: testAnswerId,
        p_language_code: testLanguage
      })
      
      if (error) throw error
      
      setNextStepResult(data)
      setTestResults(prev => [...prev, {
        name: 'Sonraki Adım Testi',
        description: `Cevap ${testAnswerId} için sonraki adım başarıyla getirildi`,
        success: true,
        data
      }])
      
      toast({
        title: "Başarılı",
        description: "Sonraki adım test edildi.",
      })
    } catch (error) {
      console.error('Sonraki adım test hatası:', error)
      setTestResults(prev => [...prev, {
        name: 'Sonraki Adım Testi',
        description: `Hata: ${error}`,
        success: false,
        data: error
      }])
      
      toast({
        title: "Hata",
        description: "Sonraki adım test edilirken hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
    setStartQuestionResult(null)
    setQuestionResult(null)
    setNextStepResult(null)
  }

  const runAllTests = async () => {
    clearTestResults()
    await testStartQuestion()
    if (state.questions.length > 0) {
      setTestQuestionId(state.questions[0].id)
      await testGetQuestion()
    }
    if (state.answers.length > 0) {
      setTestAnswerId(state.answers[0].id)
      await testNextStep()
    }
  }

  // Preview fonksiyonları
  const startFlowPreview = async () => {
    setIsPreviewLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_flow_start_question', {
        p_language_code: previewLanguage
      })
      
      if (error) throw error
      
      setCurrentFlowStep(data)
      setFlowResult(null)
      setFlowHistory([{ text: data.text }])
      
      toast({
        title: "Başarılı",
        description: "Flow başlatıldı.",
      })
    } catch (error) {
      console.error('Flow başlatma hatası:', error)
      toast({
        title: "Hata",
        description: "Flow başlatılırken hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const resetFlowPreview = () => {
    setCurrentFlowStep(null)
    setFlowResult(null)
    setFlowHistory([])
  }

  const selectAnswer = async (answer: any) => {
    if (!answer) return
    
    setIsPreviewLoading(true)
    try {
      // Cevap seçimini geçmişe ekle
      setFlowHistory(prev => [...prev, { 
        text: currentFlowStep.text, 
        selectedAnswer: answer.text 
      }])

      // Sonraki adımı getir
      const { data, error } = await supabase.rpc('get_flow_next_step', {
        p_answer_id: answer.id,
        p_language_code: previewLanguage
      })
      
      if (error) throw error
      
      if (data.type === 'action') {
        // Flow tamamlandı - action tetiklendi
        setFlowResult(data)
        setCurrentFlowStep(null)
      } else if (data.type === 'question') {
        // Sonraki soruya git
        setCurrentFlowStep(data.question)
      }
      
    } catch (error) {
      console.error('Cevap seçim hatası:', error)
      toast({
        title: "Hata",
        description: "Cevap seçilirken hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const editAnswer = (answer: { id: number; question_id: number; text: string }) => {
    setEditingAnswer(answer as any)
    setSelectedQuestionId(answer.question_id)
    setIsAnswerModalOpen(true)
  }

  const addAnswerToCurrentQuestion = () => {
    if (!currentFlowStep) return
    setEditingAnswer(null)
    setSelectedQuestionId(currentFlowStep.id)
    setIsAnswerModalOpen(true)
  }

  // Filtreleme
  const filteredQuestions = state.questions.filter(question =>
    question.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredActions = state.actions.filter(action =>
    action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitBranch className="h-8 w-8" />
            Flow Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Dinamik kullanıcı akışlarını yönetin
          </p>
        </div>
      </div>

      <Tabs value={state.activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="questions">Sorular ({state.questions.length})</TabsTrigger>
          <TabsTrigger value="answers">Cevaplar ({state.answers.length})</TabsTrigger>
          <TabsTrigger value="actions">Action'lar ({state.actions.length})</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="preview">Önizleme</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flow Soruları</CardTitle>
                  <CardDescription>
                    Kullanıcılara sorulacak soruları yönetin
                  </CardDescription>
                </div>
                <Button onClick={handleCreateQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Soru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Soru ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Başlangıç Sorusu</TableHead>
                    <TableHead>Oluşturma Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.slug}</TableCell>
                      <TableCell>
                        {question.is_start_question ? (
                          <Badge variant="default">Evet</Badge>
                        ) : (
                          <Badge variant="secondary">Hayır</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(question.created_at).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Arama kriterine uygun soru bulunamadı.' : 'Henüz soru eklenmemiş.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Answers Tab */}
        <TabsContent value="answers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flow Cevapları</CardTitle>
                  <CardDescription>
                    Sorulara verilecek cevapları ve sonraki adımları yönetin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.questions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{question.slug}</h4>
                      <Button 
                        size="sm" 
                        onClick={() => handleCreateAnswer(question.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Cevap Ekle
                      </Button>
                    </div>
                    
                    {/* Bu sorunun cevapları */}
                    <div className="space-y-2">
                      {state.answers
                        .filter(answer => answer.question_id === question.id)
                        .map((answer) => (
                          <div key={answer.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium mb-1">
                                {answer.next_question_id 
                                  ? `→ Soru ${answer.next_question_id}` 
                                  : `→ Action ${answer.action_id}`
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {answer.id} | Soru ID: {answer.question_id}
                                {answer.parameters && Object.keys(answer.parameters).length > 0 && (
                                  <span className="ml-2">
                                    | Parametreler: {JSON.stringify(answer.parameters)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAnswer(answer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAnswer(answer.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      
                      {state.answers.filter(answer => answer.question_id === question.id).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Bu soru için henüz cevap eklenmemiş.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Flow Action'ları</CardTitle>
                  <CardDescription>
                    Flow sonunda çalışacak action'ları yönetin
                  </CardDescription>
                </div>
                <Button onClick={handleCreateAction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Action
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Action ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Action Tipi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturma Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${action.color ? `border-${action.color}-500 text-${action.color}-700` : ''}`}
                          >
                            {action.category || 'general'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{action.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {action.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={action.is_active ? "default" : "secondary"}
                          className={action.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {action.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(action.created_at).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAction(action)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAction(action.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredActions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'Arama kriterine uygun action bulunamadı.' : 'Henüz action eklenmemiş.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flow Test</CardTitle>
              <CardDescription>
                RPC fonksiyonlarını test edin ve flow akışını simüle edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Test Başlangıç Sorusu */}
                <div className="space-y-3">
                  <h4 className="font-medium">1. Başlangıç Sorusu Testi</h4>
                  <div className="flex items-center gap-2">
                    <Select value={testLanguage} onValueChange={(value: string) => setTestLanguage(value as 'tr' | 'en')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={testStartQuestion} disabled={isTesting}>
                      {isTesting ? 'Test Ediliyor...' : 'Başlangıç Sorusunu Test Et'}
                    </Button>
                  </div>
                  {startQuestionResult && (
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(startQuestionResult, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Test Soru Getirme */}
                <div className="space-y-3">
                  <h4 className="font-medium">2. Belirli Soru Testi</h4>
                  <div className="flex items-center gap-2">
                    <Select value={testQuestionId?.toString() || ''} onValueChange={(value) => setTestQuestionId(parseInt(value))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Soru seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.questions.map(question => (
                          <SelectItem key={question.id} value={question.id.toString()}>
                            {question.slug}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={testLanguage} onValueChange={(value: string) => setTestLanguage(value as 'tr' | 'en')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={testGetQuestion} disabled={isTesting || !testQuestionId}>
                      {isTesting ? 'Test Ediliyor...' : 'Soruyu Test Et'}
                    </Button>
                  </div>
                  {questionResult && (
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(questionResult, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Test Sonraki Adım */}
                <div className="space-y-3">
                  <h4 className="font-medium">3. Sonraki Adım Testi</h4>
                  <div className="flex items-center gap-2">
                    <Select value={testAnswerId?.toString() || ''} onValueChange={(value) => setTestAnswerId(parseInt(value))}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Cevap seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.answers.map(answer => (
                          <SelectItem key={answer.id} value={answer.id.toString()}>
                            Cevap {answer.id} → {answer.next_question_id ? `Soru ${answer.next_question_id}` : `Action ${answer.action_id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={testLanguage} onValueChange={(value: string) => setTestLanguage(value as 'tr' | 'en')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={testNextStep} disabled={isTesting || !testAnswerId}>
                      {isTesting ? 'Test Ediliyor...' : 'Sonraki Adımı Test Et'}
                    </Button>
                  </div>
                  {nextStepResult && (
                    <div className="p-3 bg-muted rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(nextStepResult, null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Test Sonuçları */}
                <div className="space-y-3">
                  <h4 className="font-medium">4. Test Sonuçları</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={clearTestResults}>
                        Sonuçları Temizle
                      </Button>
                      <Button variant="outline" onClick={runAllTests}>
                        Tüm Testleri Çalıştır
                      </Button>
                    </div>
                    {testResults.length > 0 && (
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div key={index} className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                {result.success ? '✅' : '❌'} {result.name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{result.description}</div>
                            {result.data && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium">Detaylar</summary>
                                <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flow Önizleme ve Düzenleme</CardTitle>
              <CardDescription>
                Flow'u interaktif olarak test edin ve güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Flow Başlat */}
                <div className="space-y-3">
                  <h4 className="font-medium">Flow Başlat</h4>
                  <div className="flex items-center gap-2">
                    <Select value={previewLanguage} onValueChange={(value: string) => setPreviewLanguage(value as 'tr' | 'en')}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={startFlowPreview} disabled={isPreviewLoading}>
                      {isPreviewLoading ? 'Yükleniyor...' : 'Flow\'u Başlat'}
                    </Button>
                    <Button variant="outline" onClick={resetFlowPreview}>
                      Sıfırla
                    </Button>
                  </div>
                </div>

                {/* Mevcut Flow Durumu */}
                {currentFlowStep && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Mevcut Adım</h4>
                      <div className="space-y-2">
                        <p><strong>Soru:</strong> {currentFlowStep.text}</p>
                        <p><strong>Slug:</strong> {currentFlowStep.slug}</p>
                        <p><strong>ID:</strong> {currentFlowStep.id}</p>
                      </div>
                    </div>

                    {/* Cevap Seçenekleri */}
                    {currentFlowStep.answers && currentFlowStep.answers.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Cevap Seçenekleri</h4>
                        <div className="grid gap-2">
                          {currentFlowStep.answers.map((answer: any) => (
                            <div key={answer.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                              <div className="flex-1">
                                <p className="font-medium">{answer.text}</p>
                                <p className="text-sm text-muted-foreground">
                                  {answer.next_question_id 
                                    ? `→ Sonraki Soru: ${answer.next_question_id}` 
                                    : `→ Action: ${answer.action_id}`
                                  }
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => selectAnswer(answer)}
                                  disabled={isPreviewLoading}
                                >
                                  Seç
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editAnswer(answer)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yeni Cevap Ekle */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Bu Soruya Cevap Ekle</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => addAnswerToCurrentQuestion()}
                          disabled={!currentFlowStep}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Cevap Ekle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Flow Sonucu */}
                {flowResult && (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Flow Tamamlandı!</h4>
                      <div className="space-y-2">
                        <p><strong>Tip:</strong> {flowResult.type}</p>
                        {flowResult.type === 'action' && flowResult.action && (
                          <div>
                            <p><strong>Action:</strong> {flowResult.action.action_type}</p>
                            <p><strong>Parametreler:</strong> {JSON.stringify(flowResult.action.parameters)}</p>
                          </div>
                        )}
                        {flowResult.type === 'question' && flowResult.question && (
                          <div>
                            <p><strong>Soru:</strong> {flowResult.question.text}</p>
                            <p><strong>Slug:</strong> {flowResult.question.slug}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Flow Geçmişi */}
                {flowHistory.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Flow Geçmişi</h4>
                    <div className="space-y-2">
                      {flowHistory.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                          <span className="text-muted-foreground">{index + 1}.</span>
                          <span>{step.text}</span>
                          {step.selectedAnswer && (
                            <span className="text-muted-foreground">
                              → {step.selectedAnswer}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <QuestionFormModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        editingQuestion={editingQuestion}
      />

              <AnswerFormModal
          isOpen={isAnswerModalOpen}
          onClose={handleAnswerModalClose}
          editingAnswer={editingAnswer}
          questionId={selectedQuestionId || 0}
        />

      <ActionFormModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        editingAction={editingAction}
      />
    </div>
  )
}

export function FlowsPage() {
  return (
    <FlowsProvider>
      <FlowsPageContent />
    </FlowsProvider>
  )
}
