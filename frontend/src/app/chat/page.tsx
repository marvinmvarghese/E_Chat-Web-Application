"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import { useAuthStore, useChatStore } from "@/lib/store"
import { socketService } from "@/lib/socket"
import { cn } from "@/lib/utils"

export default function ChatPage() {
    const router = useRouter()
    const { isAuthenticated, token } = useAuthStore()
    const { activeId } = useChatStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('echat_token') : null;

        if (!storedToken && !token) {
            router.push("/login")
            return;
        }

        if (token) {
            socketService.connect(token);
        }

        return () => {
            socketService.disconnect();
        }
    }, [token, router])

    // Prevent hydration mismatch by rendering nothing until mounted on client
    if (!mounted) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar: 
           - Mobile: Visible if NO active chat
           - Desktop: Always visible (w-80)
       */}
            <ChatSidebar
                className={cn(
                    "border-r md:flex md:w-80",
                    activeId ? "hidden" : "flex w-full"
                )}
            />

            {/* Chat Window:
          - Mobile: Visible if active chat
          - Desktop: Always visible (flex-1)
       */}
            <ChatWindow
                className={cn(
                    "md:flex flex-1",
                    activeId ? "flex" : "hidden"
                )}
            />
        </div>
    )
}
