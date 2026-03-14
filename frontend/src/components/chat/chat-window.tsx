"use client"

import * as React from "react"
import { Phone, Video, Search, MoreVertical, Send, ArrowLeft, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useChatStore, useAuthStore, getChatKey, Message } from "@/lib/store"
import api from "@/lib/api"
import { socketService } from "@/lib/socket"
import { ConnectionStatus } from "@/components/connection-status"
import { EmojiPickerComponent } from "@/components/chat/emoji-picker"
import { FileUpload } from "@/components/chat/file-upload"
import { FileMessage } from "@/components/chat/file-message"
import { VoiceRecorder } from "@/components/chat/voice-recorder"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { MessageStatus } from "@/components/chat/message-status"
import { MessageSkeleton } from "@/components/ui/skeleton"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function ChatWindow({ className }: { className?: string }) {
    const { activeId, activeType, messages, setMessages, contacts, connectionStatus } = useChatStore()
    const { user } = useAuthStore()
    const [inputText, setInputText] = React.useState("")
    const [isTyping, setIsTyping] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    const activeContact = activeType === 'contact' ? contacts.find(c => c.id === activeId) : null
    const chatKey = activeId && activeType ? getChatKey(activeId, activeType) : null
    const currentMessages = chatKey ? (messages[chatKey] || []) : []

    React.useEffect(() => {
        if (activeId && activeType) fetchHistory(activeId, activeType)
    }, [activeId, activeType])

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [currentMessages])

    const fetchHistory = async (id: number, type: 'contact' | 'group') => {
        setIsLoading(true)
        try {
            const res = await api.get(`/chat/history/${id}?is_group=${type === 'group'}`)
            const mapped: Message[] = res.data.map((m: {
                id: number; content: string; sender_id: number; receiver_id?: number;
                group_id?: number; created_at: string; status?: string;
                file_url?: string; file_name?: string; duration?: number;
            }) => ({
                id: m.id, content: m.content, sender_id: m.sender_id,
                receiver_id: m.receiver_id, group_id: m.group_id,
                created_at: m.created_at, status: m.status,
                file_url: m.file_url, file_name: m.file_name,
                sender: m.sender_id === user?.id ? 'me' : 'them'
            }))
            if (chatKey) setMessages(chatKey, mapped)
        } catch (e) { console.error("Failed to fetch history", e) }
        finally { setIsLoading(false) }
    }

    const handleSendMessage = () => {
        if (!inputText.trim() || !activeId || !chatKey) return

        // ── Optimistic Update: show message INSTANTLY ──
        const tempId = -(Date.now()) // unique negative temp ID
        const optimisticMsg: Message = {
            id: tempId,
            content: inputText,
            sender_id: user?.id ?? 0,
            receiver_id: activeType === 'contact' ? activeId : undefined,
            group_id: activeType === 'group' ? activeId : undefined,
            created_at: new Date().toISOString(),
            status: 'sending',
            sender: 'me',
        }
        const { addMessage } = useChatStore.getState()
        addMessage(chatKey, optimisticMsg)

        // ── Send via socket ──
        const payload: Record<string, unknown> = { type: "text", content: inputText, _tempId: tempId }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        socketService.sendMessage(payload)
        setInputText("")
    }


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage()
    }

    const handleFileUpload = (fileData: { url: string; filename: string; type: string; size: number }) => {
        if (!activeId) return
        const payload: Record<string, unknown> = { content: fileData.filename, file_url: fileData.url, file_name: fileData.filename }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        socketService.sendMessage(payload)
    }

    const handleVoiceMessage = (fileData: { url: string; filename: string; type: string; size: number; duration?: number }) => {
        if (!activeId) return
        const payload: Record<string, unknown> = {
            content: `Voice message (${fileData.duration || 0}s)`,
            file_url: fileData.url, file_name: fileData.filename, duration: fileData.duration
        }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        socketService.sendMessage(payload)
    }

    const handleBack = () => useChatStore.setState({ activeId: null, activeType: null })

    const avatarSrc = (email?: string, url?: string) =>
        url ? `${API_BASE}${url}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'user'}`

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    /* ── Empty state ── */
    if (!activeId) {
        return (
            <div className={cn("hidden md:flex flex-col h-full items-center justify-center bg-background", className)}>
                {/* Pattern background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-tg">
                        <MessageCircle className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Welcome to E-Chat</h2>
                    <p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
                        Select a conversation on the left to start messaging securely.
                    </p>
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        End-to-end encrypted
                    </div>
                </div>
            </div>
        )
    }

    const contactName = activeContact?.name || activeContact?.email || 'Unknown'

    return (
        <div className={cn("flex flex-col h-full", className)}>

            {/* ── Chat Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    {/* Mobile back */}
                    <Button variant="ghost" size="icon"
                        className="md:hidden h-9 w-9 -ml-2 text-muted-foreground hover:text-foreground rounded-xl"
                        onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-tg">
                            <AvatarImage src={avatarSrc(activeContact?.email, activeContact?.profile_photo_url)} />
                            <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                {contactName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full status-online animate-pulse-online" />
                    </div>

                    <div>
                        <h3 className="font-bold text-sm leading-tight">{contactName}</h3>
                        <p className="text-xs text-primary font-medium">● Online</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary hover:bg-primary/10 hidden md:inline-flex">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary hover:bg-primary/10">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary hover:bg-primary/10 hidden md:inline-flex">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary hover:bg-primary/10">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Connection banner */}
            <ConnectionStatus className="mx-4 mt-2" />

            {/* ── Messages area ── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-6 space-y-2 chat-bg"
            >
                {/* Date stamp */}
                <div className="flex justify-center mb-4">
                    <div className="px-3 py-1 rounded-full bg-muted/60 backdrop-blur-sm text-[11px] text-muted-foreground font-medium border border-border/30">
                        Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>

                {/* Loading skeletons */}
                {isLoading && (
                    <div className="space-y-4">
                        <MessageSkeleton isMe={false} />
                        <MessageSkeleton isMe={true} />
                        <MessageSkeleton isMe={false} />
                    </div>
                )}

                {/* Messages */}
                {currentMessages.map((msg, i) => {
                    const isMe = msg.sender === "me"
                    const prevMsg = currentMessages[i - 1]
                    const showAvatar = !isMe && (!prevMsg || prevMsg.sender === 'me')

                    return (
                        <div key={msg.id}
                            className={cn("flex w-full gap-2 animate-message-in",
                                isMe ? "justify-end" : "justify-start"
                            )}>
                            {/* Received avatar */}
                            {!isMe && (
                                <div className="w-8 shrink-0 self-end">
                                    {showAvatar ? (
                                        <Avatar className="h-8 w-8 border border-border/30">
                                            <AvatarImage src={avatarSrc(activeContact?.email, activeContact?.profile_photo_url)} />
                                            <AvatarFallback className="bg-tg-gradient text-white text-xs">
                                                {contactName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : null}
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={cn("max-w-[72%] md:max-w-[60%] flex flex-col", isMe ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "px-4 py-2.5 text-sm leading-relaxed break-words transition-all hover:brightness-105",
                                    isMe
                                        ? "bubble-sent text-white"
                                        : "bubble-received"
                                )}>
                                    {msg.file_url ? (
                                        <FileMessage
                                            fileUrl={msg.file_url}
                                            fileName={msg.file_name || msg.content || "file"}
                                            isMe={isMe}
                                            duration={(msg as Message & { duration?: number }).duration}
                                        />
                                    ) : (
                                        <span>{msg.content}</span>
                                    )}
                                </div>

                                {/* Timestamp + status */}
                                <div className={cn(
                                    "flex items-center gap-1 mt-1 px-1 text-[11px] text-muted-foreground",
                                    isMe ? "flex-row-reverse" : ""
                                )}>
                                    <span>{formatTime(msg.created_at)}</span>
                                    {isMe && <MessageStatus status={(msg.status as 'sent' | 'delivered' | 'read') || 'read'} />}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Typing indicator */}
                {isTyping && <TypingIndicator userName={activeContact?.name || 'User'} />}
            </div>

            {/* ── Input bar ── */}
            <div className="px-4 py-3 bg-card/80 backdrop-blur-sm border-t border-border/50 shrink-0">
                <div className="flex items-center gap-2 bg-background rounded-2xl border border-border/60 px-2 py-1.5 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all">

                    {/* Attach */}
                    <FileUpload onFileSelect={handleFileUpload} />

                    {/* Text input */}
                    <Input
                        placeholder={connectionStatus === 'connected' ? "Write a message..." : "Connecting..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={connectionStatus !== 'connected'}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-sm h-9 placeholder:text-muted-foreground/60"
                    />

                    {/* Emoji */}
                    <EmojiPickerComponent onEmojiSelect={(emoji) => setInputText(prev => prev + emoji)} />

                    {/* Voice or Send */}
                    {!inputText.trim() ? (
                        <VoiceRecorder onVoiceMessageSend={handleVoiceMessage} />
                    ) : (
                        <Button
                            size="icon"
                            className="h-9 w-9 rounded-xl bg-tg-gradient text-white shadow-tg hover:opacity-90 transition-all btn-press shrink-0"
                            onClick={handleSendMessage}
                            disabled={connectionStatus !== 'connected'}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
