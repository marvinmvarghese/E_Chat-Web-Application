"use client"

import { FileText, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { AudioMessage } from "./audio-message"

interface FileMessageProps {
    fileUrl: string
    fileName: string
    isMe: boolean
    duration?: number
}

export function FileMessage({ fileUrl, fileName, isMe, duration }: FileMessageProps) {
    const fullUrl = `http://localhost:8000${fileUrl}`
    const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    const isAudio = fileUrl.match(/\.(mp3|wav|ogg|m4a|webm)$/i)

    // Audio files - render audio player
    if (isAudio) {
        return (
            <AudioMessage
                audioUrl={fileUrl}
                fileName={fileName}
                duration={duration}
                isMe={isMe}
            />
        )
    }

    // Image files - render image preview
    if (isImage) {
        return (
            <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
            >
                <img
                    src={fullUrl}
                    alt={fileName}
                    className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />
                <p className="mt-2 text-xs opacity-70">{fileName}</p>
            </a>
        )
    }

    // Other files - render download link
    return (
        <a
            href={fullUrl}
            download={fileName}
            className={cn(
                "flex items-center gap-2 p-3 rounded-lg transition-colors",
                isMe
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-secondary/50 hover:bg-secondary"
            )}
        >
            <FileText className="h-5 w-5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs opacity-70">Click to download</p>
            </div>
            <Download className="h-4 w-4" />
        </a>
    )
}
