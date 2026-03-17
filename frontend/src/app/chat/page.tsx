"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { AIChatWindow } from "@/components/chat/ai-chat-window"
import { CallManager } from "@/components/chat/call-manager"
import { useAuthStore, useChatStore } from "@/lib/store"
import { socketService } from "@/lib/socket"
import { cn } from "@/lib/utils"

export default function ChatPage() {
    const router = useRouter()
    const { token } = useAuthStore()
    const { activeId, isAIChat } = useChatStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('echat_token') : null

        if (!storedToken && !token) {
            router.push("/login")
            return
        }

        if (token) socketService.connect(token)
        return () => { socketService.disconnect() }
    }, [token, router])

    if (!mounted) return null

    const chatIsOpen = !!activeId || isAIChat

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Global call manager — handles incoming call bottom-sheet + active call screen */}
            <CallManager />

            {/* Sidebar */}
            <ChatSidebar
                className={cn(
                    "border-r md:flex md:w-80 shrink-0",
                    chatIsOpen ? "hidden" : "flex w-full"
                )}
            />

            {/* Main area */}
            <div className={cn("md:flex flex-1 overflow-hidden", chatIsOpen ? "flex" : "hidden")}>
                {isAIChat
                    ? <AIChatWindow className="flex-1" />
                    : <ChatWindow className="flex-1" />
                }
            </div>
        </div>
    )
}
