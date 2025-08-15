"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, MicOff, Copy, Trash2, Check } from 'lucide-react'
import { transcribeAudioFile } from "@/lib/aiml-stt"

// Supported languages for speech recognition
const SUPPORTED_LANGUAGES = [
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "es-MX", name: "Spanish (Mexico)" },
    { code: "fr-FR", name: "French (France)" },
    { code: "de-DE", name: "German (Germany)" },
    { code: "it-IT", name: "Italian (Italy)" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ru-RU", name: "Russian" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Mandarin)" },
    { code: "hi-IN", name: "Hindi (India)" },
    { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
    { code: "nl-NL", name: "Dutch (Netherlands)" },
    { code: "sv-SE", name: "Swedish (Sweden)" },
    { code: "da-DK", name: "Danish (Denmark)" },
    { code: "no-NO", name: "Norwegian (Norway)" },
    { code: "fi-FI", name: "Finnish (Finland)" },
    { code: "pl-PL", name: "Polish (Poland)" },
]

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null
    onend: ((this: SpeechRecognition, ev: Event) => void) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

export default function SpeechToTextApp() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [interimTranscript, setInterimTranscript] = useState("")
    const [selectedLanguage, setSelectedLanguage] = useState("en-US")
    const [isSupported, setIsSupported] = useState(true)
    const [error, setError] = useState("")
    const [copySuccess, setCopySuccess] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [transcriptionMethod, setTranscriptionMethod] = useState<'web-api' | 'aiml'>('web-api')
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [autoCopyEnabled, setAutoCopyEnabled] = useState(false)
    const [justStoppedRecording, setJustStoppedRecording] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Keyboard shortcuts
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+C to copy transcript
            if (event.ctrlKey && event.key === 'c' && transcript) {
                event.preventDefault()
                copyToClipboard()
            }
            
            // Ctrl+D to clear transcript
            if (event.ctrlKey && event.key === 'd' && transcript) {
                event.preventDefault()
                clearTranscript()
            }
            
            // Space bar to start/stop recording
            if (event.code === 'Space' && !isTranscribing) {
                event.preventDefault()
                if (transcriptionMethod === 'web-api') {
                    if (isListening) {
                        stopListening()
                    } else {
                        startListening()
                    }
                } else {
                    if (isRecording) {
                        stopWhisperRecording()
                    } else {
                        startWhisperRecording()
                    }
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [transcript, isListening, isRecording, isTranscribing, transcriptionMethod])

    // Auto copy effect when recording stops and transcript is available
    useEffect(() => {
        if (justStoppedRecording && autoCopyEnabled && transcript.trim()) {
            const timer = setTimeout(() => {
                copyToClipboard()
                setJustStoppedRecording(false)
            }, 500)
            
            return () => clearTimeout(timer)
        } else if (justStoppedRecording) {
            setJustStoppedRecording(false)
        }
    }, [justStoppedRecording, autoCopyEnabled, transcript])

    // Cleanup timer on component unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        // Check if speech recognition is supported
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (!SpeechRecognition) {
                setIsSupported(false)
                setTranscriptionMethod('aiml')
                setError("Web Speech is not supported in this browser. Using OpenAI transcription instead.")
                return
            }

            // Test if speech recognition actually works (detect network/compatibility issues)
            const testRecognition = new SpeechRecognition()
            let testTimeout: NodeJS.Timeout
            
            const handleTestError = (event: SpeechRecognitionErrorEvent) => {
                clearTimeout(testTimeout)
                if (event.error === "network" || event.error === "service-not-allowed") {
                    setIsSupported(false)
                    setTranscriptionMethod('aiml')
                    setError("Web Speech is not available in this browser or region. Switched to OpenAI transcription.")
                }
                testRecognition.removeEventListener('error', handleTestError)
            }
            
            const handleTestStart = () => {
                clearTimeout(testTimeout)
                testRecognition.stop()
                testRecognition.removeEventListener('start', handleTestStart)
                testRecognition.removeEventListener('error', handleTestError)
            }
            
            testRecognition.addEventListener('error', handleTestError)
            testRecognition.addEventListener('start', handleTestStart)
            
            // Set timeout for test
            testTimeout = setTimeout(() => {
                setIsSupported(false)
                setTranscriptionMethod('aiml')
                setError("Web Speech test failed. Switched to OpenAI transcription.")
                testRecognition.removeEventListener('error', handleTestError)
                testRecognition.removeEventListener('start', handleTestStart)
            }, 3000)
            
            try {
                testRecognition.start()
            } catch (error) {
                clearTimeout(testTimeout)
                setIsSupported(false)
                setTranscriptionMethod('aiml')
                setError("Web Speech is not available. Using OpenAI transcription instead.")
                return
            }

            // Initialize speech recognition
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = selectedLanguage

            recognition.onstart = () => {
                setIsListening(true)
                setError("")
            }

            recognition.onend = () => {
                setIsListening(false)
                setInterimTranscript("")
                stopTimer()
                setJustStoppedRecording(true)
            }

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = ""
                let interimText = ""

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript
                    } else {
                        interimText += result[0].transcript
                    }
                }

                if (finalTranscript) {
                    setTranscript(prev => prev + finalTranscript + " ")
                }
                setInterimTranscript(interimText)
            }

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                setIsListening(false)

                if (event.error === "not-allowed") {
                    setError("Microphone access denied. Please allow microphone access and try again.")
                } else if (event.error === "no-speech") {
                    setError("No speech detected. Please try speaking again.")
                } else if (event.error === "network") {
                    setIsSupported(false)
                    setTranscriptionMethod('aiml')
                    setError("Web Speech is unavailable in this browser or region. Switched to OpenAI transcription.")
                } else if (event.error === "service-not-allowed") {
                    setIsSupported(false)
                    setTranscriptionMethod('aiml')
                    setError("Web Speech is not allowed. Switched to OpenAI transcription.")
                } else {
                    setError(`Speech recognition error: ${event.error}. Try using OpenAI transcription instead.`)
                }
            }

            recognitionRef.current = recognition
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [selectedLanguage])

    const startTimer = () => {
        setRecordingTime(0)
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startListening = async () => {
        if (!recognitionRef.current || !isSupported) return

        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true })

            setError("")
            recognitionRef.current.lang = selectedLanguage
            startTimer()
            recognitionRef.current.start()
        } catch {
            setError("Microphone access denied. Please allow microphone access and try again.")
        }
    }

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        stopTimer()
    }

    const clearTranscript = () => {
        setTranscript("")
        setInterimTranscript("")
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(transcript)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (err) {
            // Handle error silently or show error state
            console.error('Failed to copy to clipboard:', err)
        }
    }



    const startWhisperRecording = async () => {
        try {
            setError("")
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            })
            
            streamRef.current = stream

            // Setup MediaRecorder with fallback for different formats
            let mimeType = 'audio/webm;codecs=opus'
            
            const supportedTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/wav'
            ]
            
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type
                    break
                }
            }
            
            console.log(`Using MIME type: ${mimeType}`)
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            })
            
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { 
                    type: mimeType 
                })
                
                // Send to OpenAI Whisper for transcription
                await transcribeWithWhisper(audioBlob)
                
                // Cleanup
                stream.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }

            // Start recording
            mediaRecorder.start()
            setIsRecording(true)
            startTimer()

        } catch (error: any) {
            setError(`Error accessing microphone: ${error.message}`)
            console.error('Microphone error:', error)
        }
    }

    const stopWhisperRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
        }
        
        setIsRecording(false)
        stopTimer()
    }

    const transcribeWithWhisper = async (audioBlob: Blob) => {
        try {
            setIsTranscribing(true)
            setError("")

            const formData = new FormData()
            
            // Determine extension based on MIME type
            let extension = 'webm'
            if (audioBlob.type.includes('mp4')) extension = 'mp4'
            else if (audioBlob.type.includes('wav')) extension = 'wav'
            else if (audioBlob.type.includes('ogg')) extension = 'ogg'
            
            formData.append('audio', audioBlob, `recording.${extension}`)

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error in transcription')
            }

            const result = await response.json()
            
            setTranscript(prev => prev + (prev ? '\n\n' : '') + result.text)

        } catch (error: any) {
            setError(`Transcription error: ${error.message}`)
            console.error('Transcription error:', error)
        } finally {
            setIsTranscribing(false)
            setJustStoppedRecording(true)
        }
    }


    return (
        <div className="min-h-screen p-4 bg-app-bg">
            <div className="max-w-4xl mx-auto space-y-6 my-12">

                <Card>
                    <CardContent className="space-y-0">
                        <div className="h-16 flex items-center gap-6 mb-0">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="aiml"
                                    name="transcriptionMethod"
                                    value="aiml"
                                    checked={transcriptionMethod === 'aiml'}
                                    onChange={() => setTranscriptionMethod('aiml')}
                                    className="h-4 w-4 text-blue-600"
                                />
                                <label htmlFor="aiml" className="text-sm font-medium cursor-pointer">
                                    OpenAI
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="web-api"
                                    name="transcriptionMethod"
                                    value="web-api"
                                    checked={transcriptionMethod === 'web-api'}
                                    onChange={() => setTranscriptionMethod('web-api')}
                                    className="h-4 w-4 text-blue-600"
                                    disabled={!isSupported}
                                />
                                <label htmlFor="web-api" className={`text-sm font-medium cursor-pointer ${!isSupported ? 'text-gray-400' : ''}`}>
                                    Web Speech {!isSupported ? '(Not Available)' : ''}
                                </label>
                            </div>
                            <div className="w-48">
                                {transcriptionMethod === 'web-api' ? (
                                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                                        <SelectTrigger className="w-full h-10">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="w-full h-10"></div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Button
                                onClick={transcriptionMethod === 'web-api' 
                                    ? (isListening ? stopListening : startListening)
                                    : (isRecording ? stopWhisperRecording : startWhisperRecording)
                                }
                                size="lg"
                                variant={(isListening || isRecording) ? "destructive" : "default"}
                                className="flex items-center gap-2"
                                disabled={isTranscribing}
                                title="Press Space to start/stop recording"
                            >
                                {(isListening || isRecording) ? (
                                    <>
                                        <MicOff className="h-5 w-5" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="h-5 w-5" />
                                        Start Recording <span className="text-xs opacity-60">(Space)</span>
                                    </>
                                )}
                            </Button>
                            {(isListening || isTranscribing || isRecording) && (
                                <Badge variant="secondary" className="animate-pulse">
                                    {isListening ? `Listening... ${formatTime(recordingTime)}` : 
                                     isRecording ? `Recording... ${formatTime(recordingTime)}` : 
                                     'Transcribing...'}
                                </Badge>
                            )}

                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Transcript</span>
                            <div className="flex gap-2">
                                <Button
                                    onClick={copyToClipboard}
                                    variant="outline"
                                    size="sm"
                                    disabled={!transcript}
                                    className={`flex items-center gap-1 transition-colors ${copySuccess ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                                    title="Copy to clipboard (Ctrl+C)"
                                >
                                    {copySuccess ? (
                                        <>
                                            <Check className="h-4 w-4 animate-pulse" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy <span className="text-xs opacity-60">(Ctrl+C)</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={clearTranscript}
                                    variant="outline"
                                    size="sm"
                                    disabled={!transcript}
                                    className="flex items-center gap-1"
                                    title="Clear transcript (Ctrl+D)"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear <span className="text-xs opacity-60">(Ctrl+D)</span>
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={transcript + interimTranscript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Your speech will appear here..."
                            className="min-h-[200px] text-sm leading-relaxed resize-none border border-input bg-background px-3 py-2 focus-visible:ring-1 focus-visible:ring-ring rounded-md"
                            rows={10}
                        />
                        
                        <div className="flex items-center justify-start gap-2 mt-4 pt-4 border-t">
                            <input
                                type="checkbox"
                                id="autoCopy"
                                checked={autoCopyEnabled}
                                onChange={(e) => setAutoCopyEnabled(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="autoCopy" className="text-sm font-medium cursor-pointer text-gray-700">
                                Auto copy transcript after recording (Ctrl+C)
                            </label>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
