import { useCallback } from 'react'
import { supabase } from '@/api/supabase'
import type { 
  FlowQuestion, 
  FlowAnswer, 
  FlowAction,
  CreateQuestionData,
  CreateAnswerData,
  CreateActionData
} from '@/api/types'

export function useFlowsApi() {

  // Question CRUD  
  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flow_questions')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Questions fetch error:', error)
      return { data: null, error }
    }
  }, [])

  const createQuestion = useCallback(async (questionData: CreateQuestionData) => {
    try {
      // Önce soruyu oluştur
      const { data: question, error: questionError } = await supabase
        .from('flow_questions')
        .insert({
          slug: questionData.slug,
          is_start_question: questionData.is_start_question || false
        })
        .select()
        .single()

      if (questionError) throw questionError

      // Sonra çevirileri ekle
      if (questionData.translations.length > 0) {
        const translations = questionData.translations.map(t => ({
          question_id: question.id,
          language_code: t.language_code,
          text: t.text
        }))

        const { error: translationError } = await supabase
          .from('flow_question_translations')
          .insert(translations)

        if (translationError) throw translationError
      }

      return { data: question, error: null }
    } catch (error) {
      console.error('Question create error:', error)
      return { data: null, error }
    }
  }, [])

  const updateQuestion = useCallback(async (id: number, questionData: Partial<FlowQuestion>) => {
    try {
      const { data, error } = await supabase
        .from('flow_questions')
        .update(questionData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Question update error:', error)
      return { data: null, error }
    }
  }, [])

  const deleteQuestion = useCallback(async (id: number) => {
    try {
      // Önce bağlı cevapları sil
      await supabase.from('flow_answers').delete().eq('question_id', id)
      // Sonra çevirileri sil
      await supabase.from('flow_question_translations').delete().eq('question_id', id)
      // Son olarak soruyu sil
      const { error } = await supabase
        .from('flow_questions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Question delete error:', error)
      return { error }
    }
  }, [])

  // Answer CRUD
  const fetchAnswers = useCallback(async (questionId?: number) => {
    try {
      let query = supabase
        .from('flow_answers')
        .select('*')
        .order('created_at', { ascending: true })

      if (questionId) {
        query = query.eq('question_id', questionId)
      }

      const { data, error } = await query

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Answers fetch error:', error)
      return { data: null, error }
    }
  }, [])

  const createAnswer = useCallback(async (answerData: CreateAnswerData) => {
    try {
      // Önce cevabı oluştur
      const { data: answer, error: answerError } = await supabase
        .from('flow_answers')
        .insert({
          question_id: answerData.question_id,
          next_question_id: answerData.next_question_id,
          action_id: answerData.action_id
        })
        .select()
        .single()

      if (answerError) throw answerError

      // Sonra çevirileri ekle
      if (answerData.translations.length > 0) {
        const translations = answerData.translations.map(t => ({
          answer_id: answer.id,
          language_code: t.language_code,
          text: t.text
        }))

        const { error: translationError } = await supabase
          .from('flow_answer_translations')
          .insert(translations)

        if (translationError) throw translationError
      }

      return { data: answer, error: null }
    } catch (error) {
      console.error('Answer create error:', error)
      return { data: null, error }
    }
  }, [])

  const updateAnswer = useCallback(async (id: number, answerData: Partial<FlowAnswer>) => {
    try {
      const { data, error } = await supabase
        .from('flow_answers')
        .update(answerData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Answer update error:', error)
      return { data: null, error }
    }
  }, [])

  const deleteAnswer = useCallback(async (id: number) => {
    try {
      // Önce çevirileri sil
      await supabase.from('flow_answer_translations').delete().eq('answer_id', id)
      // Sonra cevabı sil
      const { error } = await supabase
        .from('flow_answers')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Answer delete error:', error)
      return { error }
    }
  }, [])

  // Action CRUD
  const fetchActions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flow_actions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Actions fetch error:', error)
      return { data: null, error }
    }
  }, [])

  const createAction = useCallback(async (actionData: CreateActionData) => {
    try {
      const { data, error } = await supabase
        .from('flow_actions')
        .insert(actionData)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Action create error:', error)
      return { data: null, error }
    }
  }, [])

  const updateAction = useCallback(async (id: number, actionData: Partial<FlowAction>) => {
    try {
      const { data, error } = await supabase
        .from('flow_actions')
        .update(actionData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Action update error:', error)
      return { data: null, error }
    }
  }, [])

  const deleteAction = useCallback(async (id: number) => {
    try {
      const { error } = await supabase
        .from('flow_actions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Action delete error:', error)
      return { error }
    }
  }, [])

  // Questions with details
  const fetchQuestionsWithDetails = useCallback(async () => {
    try {
      // Soruları ve detaylarını getir
      const { data: questions, error: questionsError } = await supabase
        .from('flow_questions')
        .select(`
          *,
          translations:flow_question_translations(*),
          answers:flow_answers(
            *,
            translations:flow_answer_translations(*)
          )
        `)
        .order('created_at', { ascending: true })

      if (questionsError) throw questionsError

      return { data: questions || [], error: null }
    } catch (error) {
      console.error('Questions with details fetch error:', error)
      return { data: null, error }
    }
  }, [])

  return {
    // Question
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    fetchQuestionsWithDetails,
    
    // Answer
    fetchAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    
    // Action
    fetchActions,
    createAction,
    updateAction,
    deleteAction,
  }
}
