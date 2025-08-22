import React, { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { 
  FlowQuestion, 
  FlowAnswer, 
  FlowAction as FlowActionType,
  FlowQuestionWithDetails 
} from '@/api/types'

// State Types
interface FlowsState {
  questions: FlowQuestion[]
  answers: FlowAnswer[]
  actions: FlowActionType[]
  questionsWithDetails: FlowQuestionWithDetails[]
  activeTab: 'questions' | 'actions' | 'preview'
  loading: boolean
  error: string | null
}

// Action Types
type FlowsAction =
  | { type: 'SET_QUESTIONS'; payload: FlowQuestion[] }
  | { type: 'SET_ANSWERS'; payload: FlowAnswer[] }
  | { type: 'SET_ACTIONS'; payload: FlowActionType[] }
  | { type: 'SET_QUESTIONS_WITH_DETAILS'; payload: FlowQuestionWithDetails[] }
  | { type: 'SET_ACTIVE_TAB'; payload: 'questions' | 'actions' | 'preview' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_QUESTION'; payload: FlowQuestion }
  | { type: 'UPDATE_QUESTION'; payload: FlowQuestion }
  | { type: 'DELETE_QUESTION'; payload: number }
  | { type: 'ADD_ANSWER'; payload: FlowAnswer }
  | { type: 'UPDATE_ANSWER'; payload: FlowAnswer }
  | { type: 'DELETE_ANSWER'; payload: number }
  | { type: 'ADD_ACTION'; payload: FlowActionType }
  | { type: 'UPDATE_ACTION'; payload: FlowActionType }
  | { type: 'DELETE_ACTION'; payload: number }

// Initial State
const initialState: FlowsState = {
  questions: [],
  answers: [],
  actions: [],
  questionsWithDetails: [],
  activeTab: 'questions',
  loading: false,
  error: null,
}

// Reducer
function flowsReducer(state: FlowsState, action: FlowsAction): FlowsState {
  switch (action.type) {    
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload }
    
    case 'SET_ANSWERS':
      return { ...state, answers: action.payload }
    
    case 'SET_ACTIONS':
      return { ...state, actions: action.payload }
    
    case 'SET_QUESTIONS_WITH_DETAILS':
      return { ...state, questionsWithDetails: action.payload }
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'ADD_QUESTION':
      return { ...state, questions: [...state.questions, action.payload] }
    
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(question =>
          question.id === action.payload.id ? action.payload : question
        )
      }
    
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter(question => question.id !== action.payload)
      }
    
    case 'ADD_ANSWER':
      return { ...state, answers: [...state.answers, action.payload] }
    
    case 'UPDATE_ANSWER':
      return {
        ...state,
        answers: state.answers.map(answer =>
          answer.id === action.payload.id ? action.payload : answer
        )
      }
    
    case 'DELETE_ANSWER':
      return {
        ...state,
        answers: state.answers.filter(answer => answer.id !== action.payload)
      }
    
    case 'ADD_ACTION':
      return { ...state, actions: [...state.actions, action.payload] }
    
    case 'UPDATE_ACTION':
      return {
        ...state,
        actions: state.actions.map(act =>
          act.id === action.payload.id ? action.payload : act
        )
      }
    
    case 'DELETE_ACTION':
      return {
        ...state,
        actions: state.actions.filter(act => act.id !== action.payload)
      }
    
    default:
      return state
  }
}

// Context
interface FlowsContextType {
  state: FlowsState
  dispatch: React.Dispatch<FlowsAction>
}

const FlowsContext = createContext<FlowsContextType | undefined>(undefined)

// Provider
interface FlowsProviderProps {
  children: ReactNode
}

export function FlowsProvider({ children }: FlowsProviderProps) {
  const [state, dispatch] = useReducer(flowsReducer, initialState)

  return (
    <FlowsContext.Provider value={{ state, dispatch }}>
      {children}
    </FlowsContext.Provider>
  )
}

// Hook
export function useFlows() {
  const context = useContext(FlowsContext)
  if (context === undefined) {
    throw new Error('useFlows must be used within a FlowsProvider')
  }
  return context
}
