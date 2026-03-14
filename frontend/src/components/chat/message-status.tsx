"use client"

import { Check, CheckCheck, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageStatusProps {
    status: 'sending' | 'sent' | 'delivered' | 'read'
    className?: string
}

export function MessageStatus({ status, className }: MessageStatusProps) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {status === 'sending' && (
                <Clock className="h-3 w-3 text-white/60 animate-pulse" />
            )}
            {status === 'sent' && (
                <Check className="h-3 w-3 text-white/70" />
            )}
            {status === 'delivered' && (
                <div className="flex items-center -space-x-1">
                    <Check className="h-3 w-3 text-white/70" />
                    <Check className="h-3 w-3 text-white/70 animate-slide-in-right" />
                </div>
            )}
            {status === 'read' && (
                <CheckCheck className="h-3 w-3 text-sky-200 animate-pulse-once" />
            )}
        </div>
    )
}
