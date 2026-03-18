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
import api from "@/lib/api"

export default function ChatPage() {
    const router = useRouter()
    const { token, updateUser } = useAuthStore()
    const { activeId, isAIChat } = useChatStore()
    const [mounted, setMounted] = useState(false)

    // Re-sync profile from backend on every app mount so
    // display_name / photo stay correct after logout → login
    useEffect(() => {
        api.get('/profile/me')
            .then(res => {
                updateUser({
                    display_name: res.data.display_name,
                    profile_photo_url: res.data.profile_photo_url,
                    about: res.data.about,
                })
            })
            .catch(() => {/* silently ignore — user may not be logged in yet */})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setMounted(true)
        // Read token from store OR directly from localStorage (handles hydration timing)
        const storedAuth = typeof window !== 'undefined'
            ? (() => { try { return JSON.parse(localStorage.getItem('echat-auth-storage') || '{}')?.state?.token } catch { return null } })()
            : null
        const activeToken = token || storedAuth

        if (!activeToken) {
            router.push("/login")
            return
        }
        // Also store raw token for api.ts interceptor
        if (activeToken) localStorage.setItem('echat_token', activeToken)

        socketService.connect(activeToken)
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
