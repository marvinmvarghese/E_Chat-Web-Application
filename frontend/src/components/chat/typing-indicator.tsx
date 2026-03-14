"use client"

import { cn } from "@/lib/utils"
import { useChatStore, getChatKey } from "@/lib/store"

interface TypingIndicatorProps {
    userName: string
    className?: string
}

export function TypingIndicator({ userName, className }: TypingIndicatorProps) {
    const { activeId, activeType, typingUsers, contacts } = useChatStore()

    // Compute the set of people typing in this chat
    const chatKey = activeId && activeType ? getChatKey(activeId, activeType) : null
    const typingSet = chatKey ? typingUsers[chatKey] : null
    const isTyping = typingSet && typingSet.size > 0

    if (!isTyping) return null

    // Get the name of who's typing
    const typingUserId = typingSet ? [...typingSet][0] : null
    const typingContact = typingUserId ? contacts.find(c => c.id === typingUserId) : null
    const name = typingContact?.name || userName

    return (
        <div className={cn("flex items-center gap-2 mt-3 ml-9 animate-message-in", className)}>
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-card border border-border/40 rounded-2xl rounded-bl-sm w-fit">
                <span className="text-xs text-muted-foreground mr-1">{name} is typing</span>
                <span className="typing-dot w-1.5 h-1.5 bg-primary/70 rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-primary/70 rounded-full" />
                <span className="typing-dot w-1.5 h-1.5 bg-primary/70 rounded-full" />
            </div>
        </div>
    )
}
