"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AudioMessageProps {
    audioUrl: string
    fileName: string
    duration?: number
    isMe: boolean
}

export function AudioMessage({ audioUrl, fileName, duration, isMe }: AudioMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [totalDuration, setTotalDuration] = useState(duration || 0)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Initialize audio
    useEffect(() => {
        const fullUrl = `http://localhost:8000${audioUrl}`
        const audio = new Audio(fullUrl)
        audioRef.current = audio

        audio.addEventListener('loadedmetadata', () => {
            setTotalDuration(audio.duration)
        })

        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime)
        })

        audio.addEventListener('ended', () => {
            setIsPlaying(false)
            setCurrentTime(0)
        })

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [audioUrl])

    // Toggle play/pause
    const togglePlay = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    // Seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return
        const time = parseFloat(e.target.value)
        audioRef.current.currentTime = time
        setCurrentTime(time)
    }

    const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

    return (
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg min-w-[200px]",
            isMe ? "bg-white/10" : "bg-secondary/50"
        )}>
            {/* Play/Pause Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 shrink-0"
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </Button>

            {/* Waveform/Progress */}
            <div className="flex-1 flex flex-col gap-1">
                <input
                    type="range"
                    min="0"
                    max={totalDuration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${isMe ? '#fff' : '#8B5CF6'} 0%, ${isMe ? '#fff' : '#8B5CF6'} ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                    }}
                />
                <div className="flex justify-between text-xs opacity-70">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>
            </div>

            {/* Download Button */}
            <a
                href={`http://localhost:8000${audioUrl}`}
                download={fileName}
                className="shrink-0"
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                >
                    <Download className="h-4 w-4" />
                </Button>
            </a>
        </div>
    )
}
