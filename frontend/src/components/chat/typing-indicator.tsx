"use client"

import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
    userName: string
    className?: string
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
    return (
        <div className={cn("flex items-center gap-3 px-4 py-2 animate-message-in", className)}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary rounded-2xl rounded-bl-sm border border-border/40">
                <span className="text-sm text-muted-foreground">{userName} is typing</span>
                <div className="flex gap-1">
                    <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full" />
                </div>
            </div>
        </div>
    )
}
