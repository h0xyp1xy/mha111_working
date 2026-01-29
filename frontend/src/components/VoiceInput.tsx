import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { MicrophoneIcon, MicrophoneOffIcon, HappyIcon, NeutralIcon, SadIcon, AnxiousIcon, AngryIcon, CalmIcon } from './Icons'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
}

export const VoiceInput = ({ onTranscript, onStartRecording, onStopRecording }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false)
  const [amplitude, setAmplitude] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const animationFrameRef = useRef<number>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const { isRecording } = useStore()

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ru-RU'

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Update text input with accumulated final + current interim
        if (finalTranscript) {
          setTextInput((prev) => (prev + ' ' + finalTranscript).trim())
          setInterimText('')
        }
        
        // Show interim text separately while speaking
        if (interimTranscript) {
          setInterimText(interimTranscript)
        } else {
          setInterimText('')
        }
      }

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        useStore.getState().setIsRecording(false)
        onStopRecording()
        
        // Show user-friendly error message
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions in your browser settings.')
        } else if (event.error === 'no-speech') {
          // This is normal when user stops speaking, don't show error
        } else {
          alert(`Speech recognition error: ${event.error}. Please try typing your message instead.`)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        useStore.getState().setIsRecording(false)
        // Add any remaining interim text to final text
        if (interimText) {
          setTextInput((prev) => (prev + ' ' + interimText).trim())
          setInterimText('')
        }
        onStopRecording()
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [onTranscript])

  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const width = canvas.width
      const height = canvas.height
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      if (isListening && analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteTimeDomainData(dataArray)

        ctx.strokeStyle = `hsl(${200 + amplitude * 50}, 70%, 60%)`
        ctx.lineWidth = 2
        ctx.beginPath()

        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = v * (height / 2) * amplitude + centerY

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.stroke()

        // Calculate average amplitude
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        setAmplitude(average / 128)
      } else {
        // Draw static circle when not listening
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(width / 2, centerY, 30, 0, 2 * Math.PI)
        ctx.stroke()
      }

      animationFrameRef.current = requestAnimationFrame(drawWaveform)
    }

    drawWaveform()
  }, [isListening, amplitude])

  const startListening = async () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in your browser. Please use the text input instead.')
      return
    }

    try {
      // Initialize audio context for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
      }

      recognitionRef.current.start()
      setIsListening(true)
      useStore.getState().setIsRecording(true)
      onStartRecording()
    } catch (error: any) {
      console.error('Error starting speech recognition:', error)
      setIsListening(false)
      useStore.getState().setIsRecording(false)
      if (error?.name === 'NotAllowedError') {
        alert('Microphone access denied. Please enable microphone permissions and try again.')
      } else {
        alert('Failed to start voice recording. Please try typing your message instead.')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    useStore.getState().setIsRecording(false)
    setInterimText('')
    onStopRecording()
    // Keep text in input field for user to review and send
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const textToSend = (interimText || textInput).trim()
    if (textToSend) {
      onTranscript(textToSend)
      setTextInput('')
      setInterimText('')
    }
  }

  const getColor = () => {
    if (amplitude > 0.7) return 'bg-red-500'
    if (amplitude > 0.4) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Voice Input Circle */}
      <div className="relative">
        <motion.button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-32 h-32 rounded-full ${getColor()} shadow-lg border-2 border-[var(--soft-gray)] flex items-center justify-center transition-all duration-300 ${
            isListening ? 'scale-110' : 'scale-100'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isListening
              ? [
                  '0 0 20px rgba(74, 155, 140, 0.5)',
                  '0 0 40px rgba(74, 155, 140, 0.8)',
                  '0 0 20px rgba(74, 155, 140, 0.5)',
                ]
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
        >
          <canvas
            ref={canvasRef}
            width={128}
            height={128}
            className="absolute inset-0 rounded-full"
          />
          <div className="relative z-10 text-white">
            {isListening ? (
              <MicrophoneIcon size={32} className="w-8 h-8" />
            ) : (
              <MicrophoneOffIcon size={32} className="w-8 h-8" />
            )}
          </div>
        </motion.button>

        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 rounded-full border-4 border-white/50"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status Text */}
      <motion.p
        className="text-[var(--primary-900)] text-lg font-medium"
        animate={{ opacity: isListening ? 1 : 0.7 }}
      >
        {isListening ? 'Слушаю...' : 'Нажми, чтобы начать запись'}
      </motion.p>

      {/* Text Input - shows voice transcription or manual input */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput + (interimText ? ' ' + interimText : '')}
              onChange={(e) => {
                const newValue = e.target.value
                // Remove interim text from the end if user is editing
                if (interimText && newValue.endsWith(interimText)) {
                  // User might have typed, so clear interim and update text
                  setTextInput(newValue.replace(interimText, '').trim())
                  setInterimText('')
                } else {
                  // User is manually typing
                  setTextInput(newValue)
                  setInterimText('')
                }
              }}
              placeholder={isListening ? "Говори..." : "Введи сообщение или используй голосовой ввод"}
              className="w-full px-4 py-3 pr-20 rounded-lg neu-input text-[var(--primary-900)] placeholder-gray-400 shadow-sm"
            />
            {isListening && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Запись...
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={!textInput.trim() && !interimText.trim()}
            className="px-6 py-3 neu-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отправить
          </button>
        </div>
      </form>

      {/* Quick Mood Selection */}
      <div className="flex space-x-2">
        {[
          { icon: HappyIcon, label: 'Хорошо' },
          { icon: NeutralIcon, label: 'Нормально' },
          { icon: SadIcon, label: 'Не очень' },
          { icon: AnxiousIcon, label: 'Тревожно' },
          { icon: AngryIcon, label: 'Злостно' },
          { icon: CalmIcon, label: 'Спокойно' },
        ].map((mood, index) => (
          <motion.button
            key={index}
            onClick={() => onTranscript(`Я чувствую себя ${mood.label.toLowerCase()}`)}
            className="w-12 h-12 rounded-full bg-[var(--primary-50)] border border-[var(--soft-gray)] hover:bg-[var(--primary-50)] hover:border-[var(--primary-400)] transition-colors shadow-sm flex items-center justify-center text-[var(--primary-700)]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={mood.label}
          >
            <mood.icon size={20} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

