import { create } from 'zustand'
import type { ConversationSession, EmotionalState } from '../types'

interface AppState {
  currentSession: ConversationSession | null
  currentEmotionalState: EmotionalState | null
  isRecording: boolean
  riskDetected: boolean
  setCurrentSession: (session: ConversationSession | null) => void
  setCurrentEmotionalState: (state: EmotionalState | null) => void
  setIsRecording: (recording: boolean) => void
  setRiskDetected: (risk: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  currentSession: null,
  currentEmotionalState: null,
  isRecording: false,
  riskDetected: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  setCurrentEmotionalState: (state) => set({ currentEmotionalState: state }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setRiskDetected: (risk) => set({ riskDetected: risk }),
}))

