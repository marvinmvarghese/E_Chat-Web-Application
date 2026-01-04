"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

interface VoiceRecorderProps {
    onVoiceMessageSend: (fileData: { url: string; filename: string; type: string; size: number; duration?: number }) => void
}

export function VoiceRecorder({ onVoiceMessageSend }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isUploading, setIsUploading] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                await uploadVoiceMessage(blob)
                cleanup()
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error('Error accessing microphone:', error)
            alert('Could not access microphone. Please grant permission.')
        }
    }

    // Stop recording and send
    const stopAndSend = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    // Cancel recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            chunksRef.current = []
        }
        cleanup()
    }

    // Upload voice message
    const uploadVoiceMessage = async (blob: Blob) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            const filename = `voice_${Date.now()}.webm`
            formData.append('file', blob, filename)

            const response = await api.post('/chat/upload', formData)

            onVoiceMessageSend({
                ...response.data,
                duration: recordingTime
            })
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Failed to send voice message')
        } finally {
            setIsUploading(false)
        }
    }

    // Cleanup
    const cleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setRecordingTime(0)
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup()
    }, [])

    if (isUploading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sending...</span>
            </div>
        )
    }

    if (isRecording) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2 flex-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-red-600 dark:text-red-400">
                        {formatTime(recordingTime)}
                    </span>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelRecording}
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                >
                    <X className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={stopAndSend}
                    className="h-8 w-8 text-muted-foreground hover:text-green-600"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            type="button"
        >
            <Mic className="h-5 w-5" />
        </Button>
    )
}
