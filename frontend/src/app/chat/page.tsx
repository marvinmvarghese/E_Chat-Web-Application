"use client"

import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"

export default function ChatPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <ChatSidebar className="w-80 hidden md:flex" />
            <ChatWindow className="flex-1" />
        </div>
    )
}
