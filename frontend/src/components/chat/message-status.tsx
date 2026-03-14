"use client"

import { Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageStatusProps {
    status: 'sent' | 'delivered' | 'read'
    className?: string
}

export function MessageStatus({ status, className }: MessageStatusProps) {
    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {status === 'sent' && (
                <Check className="h-3 w-3 text-muted-foreground" />
            )}
            {status === 'delivered' && (
                <div className="flex items-center -space-x-1">
                    <Check className="h-3 w-3 text-muted-foreground" />
                    <Check className="h-3 w-3 text-muted-foreground animate-slide-in-right" />
                </div>
            )}
            {status === 'read' && (
                <CheckCheck className="h-3 w-3 text-primary animate-pulse-once" />
            )}
        </div>
    )
}
