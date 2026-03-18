"use client"

import * as React from "react"
import { Phone, Video, MoreVertical, Send, ArrowLeft, MessageCircle, Heart, Pin, Forward, X, Check, Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, timeAgo, formatTime } from "@/lib/utils"
import { useChatStore, useAuthStore, getChatKey, Message } from "@/lib/store"
import api from "@/lib/api"
import { socketService } from "@/lib/socket"
import { ConnectionStatus } from "@/components/connection-status"
import { EmojiPickerComponent } from "@/components/chat/emoji-picker"
import { FileUpload } from "@/components/chat/file-upload"
import { FileMessage } from "@/components/chat/file-message"
import { VoiceRecorder } from "@/components/chat/voice-recorder"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { MessageSkeleton } from "@/components/ui/skeleton"
import { CallScreen, type CallState } from "@/components/chat/call-screen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/* ── Relative timestamp hook (auto-refreshes every 15s) ── */
function useLiveTime() {
    const [, setTick] = React.useState(0)
    React.useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 15_000)
        return () => clearInterval(t)
    }, [])
}

/* ── Message bubble component ── */
interface BubbleProps {
    msg: Message
    isMe: boolean
    isFirstInGroup: boolean
    isLastInGroup: boolean
    isLastMsg: boolean
    isLastRead: boolean
    contactName: string
    contactAvatarSrc: string
    onReact: (msgId: number, emoji: string) => void
    reactions: Record<number, string>
    onPin: (msg: Message) => void
    onForward: (msg: Message) => void
    isPinned: boolean
    onEdit: (msg: Message) => void
    onDelete: (msg: Message) => void
}

function MessageBubble({
    msg, isMe, isFirstInGroup, isLastInGroup, isLastMsg, isLastRead,
    contactName, contactAvatarSrc, onReact, reactions, onPin, onForward, isPinned, onEdit, onDelete
}: BubbleProps) {
    const [hovered, setHovered] = React.useState(false)
    const [showTime, setShowTime] = React.useState(false)
    const reaction = reactions[msg.id]
    const isSending = msg.id < 0

    // Border radius — Instagram style (tight clusters, only corners exposed)
    const sentRadius = isMe
        ? cn(
            "rounded-2xl",
            isFirstInGroup && !isLastInGroup && "rounded-tr-md",
            !isFirstInGroup && isLastInGroup && "rounded-br-md",
            !isFirstInGroup && !isLastInGroup && "rounded-r-md"
        )
        : cn(
            "rounded-2xl",
            isFirstInGroup && !isLastInGroup && "rounded-tl-md",
            !isFirstInGroup && isLastInGroup && "rounded-bl-md",
            !isFirstInGroup && !isLastInGroup && "rounded-l-md"
        )

    return (
        <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
            {/* Row containing avatar + bubble */}
            <div className={cn("flex items-end gap-2 max-w-[75%] md:max-w-[62%] group",
                isMe ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Contact avatar (only on last in group) */}
                {!isMe && (
                    <div className="w-7 shrink-0 self-end mb-0.5">
                        {isLastInGroup ? (
                            <Avatar className="h-7 w-7 border border-border/30">
                                <AvatarImage src={contactAvatarSrc} />
                                <AvatarFallback className="bg-tg-gradient text-white text-[10px]">
                                    {contactName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ) : null}
                    </div>
                )}

                {/* Bubble + reactions + time popup */}
                <div
                    className="relative"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => { setHovered(false); setShowTime(false) }}
                >
                    {/* Bubble */}
                    <div
                        className={cn(
                            "px-4 py-2.5 text-sm leading-relaxed break-words transition-all",
                            sentRadius,
                            isMe
                                ? "bg-tg-gradient text-white shadow-tg"
                                : "bg-card border border-border/40 text-foreground",
                            isSending && "opacity-70",
                            "cursor-pointer select-text"
                        )}
                        onDoubleClick={() => onReact(msg.id, "\u2764\uFE0F")}
                    >
                        {/* WhatsApp-style forwarded indicator */}
                        {msg.is_forwarded && (
                            <div className="flex items-center gap-1 mb-1 opacity-60">
                                <Forward className="h-3 w-3" />
                                <span className="text-[11px] font-medium">Forwarded</span>
                            </div>
                        )}
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
                        {/* Edited indicator */}
                        {msg.edited && (
                            <span className="text-[10px] opacity-50 ml-1 italic">(edited)</span>
                        )}
                    </div>

                    {/* Reaction badge */}
                    {reaction && (
                        <div className={cn(
                            "absolute -bottom-3 text-base select-none pointer-events-none animate-scale-in",
                            isMe ? "left-2" : "right-2"
                        )}>
                            {reaction}
                        </div>
                    )}

                    {/* Hover action row */}
                    {hovered && !isSending && (
                        <div className={cn(
                            "absolute -top-8 flex items-center gap-1 bg-card border border-border/50 rounded-full px-2 py-1 shadow-md animate-scale-in z-20",
                            isMe ? "right-0" : "left-0"
                        )}>
                            <button onClick={() => onReact(msg.id, "\u2764\uFE0F")}
                                className="hover:scale-125 transition-transform text-sm">❤️</button>
                            <button onClick={() => onReact(msg.id, "\uD83D\uDE02")}
                                className="hover:scale-125 transition-transform text-sm">😂</button>
                            <button onClick={() => onReact(msg.id, "\uD83D\uDC4D")}
                                className="hover:scale-125 transition-transform text-sm">👍</button>
                            <button onClick={() => onReact(msg.id, "\uD83D\uDE2E")}
                                className="hover:scale-125 transition-transform text-sm">😮</button>
                            <div className="w-px h-4 bg-border mx-0.5" />
                            <button onClick={() => !isSending && onPin(msg)}
                                title={isPinned ? "Unpin" : "Pin"}
                                className={cn("hover:scale-125 transition-transform p-0.5", isPinned ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                                <Pin className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => !isSending && onForward(msg)}
                                title="Forward"
                                className="text-muted-foreground hover:text-foreground hover:scale-125 transition-transform p-0.5">
                                <Forward className="h-3.5 w-3.5" />
                            </button>
                            {isMe && !isSending && (
                                <>
                                    <div className="w-px h-4 bg-border mx-0.5" />
                                    <button onClick={() => onEdit(msg)}
                                        title="Edit"
                                        className="text-muted-foreground hover:text-blue-400 hover:scale-125 transition-transform p-0.5">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button onClick={() => onDelete(msg)}
                                        title="Delete"
                                        className="text-muted-foreground hover:text-red-400 hover:scale-125 transition-transform p-0.5">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Time tooltip */}
                    {(hovered || showTime) && !isSending && (
                        <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] text-muted-foreground bg-background/90 backdrop-blur-sm border border-border/40 rounded-lg px-2.5 py-1 shadow-sm pointer-events-none z-10 animate-fade-in",
                            isMe ? "right-full mr-2" : "left-full ml-2"
                        )}>
                            {formatTime(msg.created_at)}
                        </div>
                    )}
                </div>
            </div>

            {/* Relative timestamp (only for last in group) */}
            {isLastInGroup && (
                <p className={cn(
                    "text-[11px] text-muted-foreground mt-1 px-1 transition-all",
                    isMe ? "pr-2 text-right" : "pl-9 text-left"
                )}>
                    {isSending ? "Sending..." : timeAgo(msg.created_at)}
                </p>
            )}

            {/* ── "Seen" indicator (Instagram style) ── */}
            {isMe && isLastRead && (
                <div className="flex items-center gap-1 pr-2 mt-0.5 animate-fade-in">
                    <Avatar className="h-3.5 w-3.5 border border-primary/30">
                        <AvatarImage src={contactAvatarSrc} />
                        <AvatarFallback className="bg-tg-gradient text-white text-[6px]">
                            {contactName.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-primary font-medium">Seen</span>
                </div>
            )}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════
   MAIN CHAT WINDOW
══════════════════════════════════════════════════════════ */
export function ChatWindow({ className }: { className?: string }) {
    useLiveTime() // keep relative timestamps fresh

    const { activeId, activeType, messages, setMessages, contacts, connectionStatus, pinnedMessages, pinMessage, editMessageInStore, deleteMessageFromStore } = useChatStore()
    const { user } = useAuthStore()
    const [inputText, setInputText] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [reactions, setReactions] = React.useState<Record<number, string>>({})
    const [activelyTyping, setActivelyTyping] = React.useState(false)
    const [forwardMsg, setForwardMsg] = React.useState<Message | null>(null)
    const [forwardingTo, setForwardingTo] = React.useState<number | null>(null)
    const [editingMsg, setEditingMsg] = React.useState<Message | null>(null)
    const [activeCall, setActiveCall] = React.useState<{ peerId: number; peerName: string; peerAvatar?: string; callType: 'audio' | 'video'; direction: 'outgoing' | 'incoming' } | null>(null)
    const typingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const scrollRef = React.useRef<HTMLDivElement>(null)
    // pendingMessages: tracks in-flight optimistic messages for HTTP fallback
    interface PendingMsg { content?: string; receiverId?: number; groupId?: number; extras: Record<string, unknown> }
    const pendingMessages = React.useRef<Record<number, PendingMsg>>({})


    const activeContact = activeType === 'contact' ? contacts.find(c => c.id === activeId) : null
    const chatKey = activeId && activeType ? getChatKey(activeId, activeType) : null
    const pinnedMsg = chatKey ? pinnedMessages[chatKey] ?? null : null
    const pinnedMsgId = pinnedMsg?.id ?? null

    const currentMessages = chatKey ? (messages[chatKey] || []) : []

    // Scroll to bottom on new messages
    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [currentMessages])

    // Fetch history on chat change
    React.useEffect(() => {
        if (activeId && activeType) fetchHistory(activeId, activeType)
    }, [activeId, activeType])

    // ── HTTP fallback: send via REST when socket fails ─────────────────────
    const sendViaHttp = React.useCallback(async (
        content: string | undefined,
        receiverId: number | undefined,
        groupId: number | undefined,
        tempId: number,
        extras: { file_url?: string; file_name?: string; file_type?: string; file_size?: number } = {}
    ) => {
        if (!chatKey) return
        try {
            const body: Record<string, unknown> = { content, receiver_id: receiverId, group_id: groupId, ...extras }
            const res = await api.post('/chat/message', body)
            const saved = res.data
            const confirmed: Message = {
                id: saved.id, content: saved.content,
                sender_id: saved.sender_id, receiver_id: saved.receiver_id,
                group_id: saved.group_id, created_at: saved.created_at,
                status: saved.status ?? 'sent', sender: 'me',
                file_url: saved.file_url, file_name: saved.file_name, file_type: saved.file_type,
            }
            useChatStore.getState().replaceOptimisticMessage(chatKey, tempId, confirmed)
        } catch (err) {
            console.error('HTTP fallback also failed:', err)
        }
    }, [chatKey])

    // Register fallback: when backend emits message_error, retry via HTTP
    React.useEffect(() => {
        // Store pending messages keyed by tempId so HTTP retry knows what to send
        const pendingRef = pendingMessages
        socketService.messageErrorCallback = (tempId) => {
            if (tempId === null) return
            const pending = pendingRef.current[tempId]
            if (pending) {
                sendViaHttp(pending.content, pending.receiverId, pending.groupId, tempId, pending.extras)
                delete pendingRef.current[tempId]
            }
        }
        return () => { socketService.messageErrorCallback = null }
    }, [sendViaHttp])

    const fetchHistory = async (id: number, type: 'contact' | 'group') => {
        setIsLoading(true)
        try {
            const res = await api.get(`/chat/history/${id}?is_group=${type === 'group'}`)
            const mapped: Message[] = res.data.map((m: {
                id: number; content: string; sender_id: number; receiver_id?: number;
                group_id?: number; created_at: string; status?: string;
                file_url?: string; file_name?: string;
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

        // Optimistic update
        const tempId = -(Date.now())
        const optimisticMsg: Message = {
            id: tempId, content: inputText,
            sender_id: user?.id ?? 0,
            receiver_id: activeType === 'contact' ? activeId : undefined,
            group_id: activeType === 'group' ? activeId : undefined,
            created_at: new Date().toISOString(),
            status: 'sending', sender: 'me',
        }
        useChatStore.getState().addMessage(chatKey, optimisticMsg)

        const receiverId = activeType === 'contact' ? activeId : undefined
        const groupId   = activeType === 'group'   ? activeId : undefined

        // Register pending for HTTP fallback
        pendingMessages.current[tempId] = { content: inputText, receiverId, groupId, extras: {} }

        // Send via socket
        const payload: Record<string, unknown> = { type: "text", content: inputText, _tempId: tempId }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        const sent = socketService.sendMessage(payload)

        // If socket is not connected at all, fall back to HTTP immediately
        if (!sent) {
            sendViaHttp(inputText, receiverId, groupId, tempId)
            delete pendingMessages.current[tempId]
        }

        setInputText("")

        // Stop typing indicator
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        if (activelyTyping) {
            socketService.sendTypingStop(activeType === 'contact' ? activeId : undefined,
                activeType === 'group' ? activeId : undefined)
            setActivelyTyping(false)
        }

        // ── 5-second safety net: if socket never confirms, fall back to HTTP ──
        // This handles ALL silent failures: session loss, DB errors, proxy drops, etc.
        setTimeout(() => {
            const currentMsgs = useChatStore.getState().messages[chatKey] || []
            const stillPending = currentMsgs.find(m => m.id === tempId)
            if (stillPending) {
                console.warn(`⏱ Message ${tempId} still pending after 5s — falling back to HTTP`)
                sendViaHttp(inputText, receiverId, groupId, tempId)
                delete pendingMessages.current[tempId]
            }
        }, 5000)
    }


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value)

        // Typing indicator
        if (!activelyTyping && e.target.value) {
            setActivelyTyping(true)
            socketService.sendTypingStart(activeType === 'contact' ? activeId! : undefined,
                activeType === 'group' ? activeId! : undefined)
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => {
            setActivelyTyping(false)
            socketService.sendTypingStop(activeType === 'contact' ? activeId! : undefined,
                activeType === 'group' ? activeId! : undefined)
        }, 2000)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage()
    }

    const handleFileUpload = (fileData: { url: string; filename: string; type: string; size: number }) => {
        if (!activeId || !chatKey) return

        // Optimistic bubble for file upload
        const tempId = -(Date.now())
        const optimisticMsg: Message = {
            id: tempId, content: fileData.filename,
            sender_id: user?.id ?? 0,
            receiver_id: activeType === 'contact' ? activeId : undefined,
            group_id: activeType === 'group' ? activeId : undefined,
            created_at: new Date().toISOString(),
            status: 'sending', sender: 'me',
            file_url: fileData.url, file_name: fileData.filename, file_type: fileData.type,
        }
        useChatStore.getState().addMessage(chatKey, optimisticMsg)

        const payload: Record<string, unknown> = {
            content: fileData.filename,
            file_url: fileData.url,
            file_name: fileData.filename,
            file_type: fileData.type,
            file_size: fileData.size,
            _tempId: tempId,
        }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        socketService.sendMessage(payload)
    }

    const handleVoiceMessage = (fileData: { url: string; filename: string; type: string; size: number; duration?: number }) => {
        if (!activeId || !chatKey) return

        // Optimistic bubble for voice message
        const tempId = -(Date.now())
        const voiceContent = `Voice message (${fileData.duration || 0}s)`
        const optimisticMsg: Message = {
            id: tempId, content: voiceContent,
            sender_id: user?.id ?? 0,
            receiver_id: activeType === 'contact' ? activeId : undefined,
            group_id: activeType === 'group' ? activeId : undefined,
            created_at: new Date().toISOString(),
            status: 'sending', sender: 'me',
            file_url: fileData.url, file_name: fileData.filename, file_type: fileData.type,
        }
        useChatStore.getState().addMessage(chatKey, optimisticMsg)

        const payload: Record<string, unknown> = {
            content: voiceContent,
            file_url: fileData.url,
            file_name: fileData.filename,
            file_type: fileData.type,
            file_size: fileData.size,
            duration: fileData.duration,
            _tempId: tempId,
        }
        if (activeType === 'group') payload.group_id = activeId
        else payload.receiver_id = activeId
        socketService.sendMessage(payload)
    }

    const handleReact = (msgId: number, emoji: string) => {
        setReactions(prev => {
            if (prev[msgId] === emoji) {
                const next = { ...prev }; delete next[msgId]; return next
            }
            return { ...prev, [msgId]: emoji }
        })
    }

    const handlePin = (msg: Message) => {
        if (!chatKey) return
        // Toggle: if same message is already pinned, unpin it
        pinMessage(chatKey, pinnedMsgId === msg.id ? null : msg)
    }

    const handleForward = (msg: Message) => {
        setForwardMsg(msg)
    }

    const doForward = async (targetId: number) => {
        if (!forwardMsg) return
        setForwardingTo(targetId)
        // WhatsApp-style: send original content as-is, with is_forwarded flag
        const payload: Record<string, unknown> = {
            content: forwardMsg.content || '',
            receiver_id: targetId,
            is_forwarded: true,
        }
        if (forwardMsg.file_url) {
            payload.file_url = forwardMsg.file_url
            payload.file_name = forwardMsg.file_name
        }
        socketService.sendMessage(payload)
        setForwardMsg(null)
        setForwardingTo(null)
    }

    const handleEdit = (msg: Message) => {
        setEditingMsg(msg)
        setInputText(msg.content || '')
    }

    const handleDelete = (msg: Message) => {
        if (!chatKey) return
        // Optimistic: remove from store immediately
        deleteMessageFromStore(chatKey, msg.id)
        socketService.deleteMessage(msg.id)
    }

    const handleConfirmEdit = () => {
        if (!editingMsg || !inputText.trim() || !chatKey) return
        const newContent = inputText.trim()
        editMessageInStore(chatKey, editingMsg.id, newContent)
        socketService.editMessage(editingMsg.id, newContent)
        setEditingMsg(null)
        setInputText('')
    }

    const handleCancelEdit = () => {
        setEditingMsg(null)
        setInputText('')
    }

    const handleBack = () => useChatStore.setState({ activeId: null, activeType: null })

    const avatarSrc = (email?: string, url?: string) =>
        url ? `${API_BASE}${url}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'user'}`

    // Find the last message sent by ME that has been read
    const lastReadMsgId = React.useMemo(() => {
        const myReadMsgs = currentMessages.filter(m => m.sender === 'me' && m.status === 'read' && m.id > 0)
        return myReadMsgs.length > 0 ? myReadMsgs[myReadMsgs.length - 1].id : null
    }, [currentMessages])

    // ── Empty state ──
    if (!activeId) {
        return (
            <div className={cn("hidden md:flex flex-col h-full items-center justify-center bg-background", className)}>
                <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 flex flex-col items-center text-center px-8">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 shadow-tg">
                        <MessageCircle className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Your messages</h2>
                    <p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
                        Select a conversation to start sending private, encrypted messages.
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
    const contactAvatar = avatarSrc(activeContact?.email, activeContact?.profile_photo_url)

    // Group consecutive messages from the same sender
    type GroupedMsg = { msg: Message; isFirst: boolean; isLast: boolean }
    const grouped: GroupedMsg[] = currentMessages.map((msg, i) => {
        const prev = currentMessages[i - 1]
        const next = currentMessages[i + 1]
        const samePrev = prev && prev.sender === msg.sender
        const sameNext = next && next.sender === msg.sender
        return { msg, isFirst: !samePrev, isLast: !sameNext }
    })

    return (
        <div className={cn("flex flex-col h-full", className)}>

            {/* Active call overlay (outgoing calls initiated from this window) */}
            {activeCall && (
                <CallScreen
                    call={activeCall as CallState}
                    onEnd={() => setActiveCall(null)}
                />
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/90 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon"
                        className="md:hidden h-9 w-9 -ml-2 rounded-xl hover:bg-primary/10"
                        onClick={handleBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="relative cursor-pointer">
                        <Avatar className="h-10 w-10 border-2 border-primary/25 shadow-tg">
                            <AvatarImage src={contactAvatar} />
                            <AvatarFallback className="bg-tg-gradient text-white text-sm font-bold">
                                {contactName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full status-online animate-pulse-online" />
                    </div>

                    <div>
                        <h3 className="font-bold text-sm leading-tight">{contactName}</h3>
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                            Active now
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon"
                        className="h-9 w-9 rounded-xl hover:text-emerald-500 hover:bg-emerald-500/10 hidden md:inline-flex"
                        title="Voice call"
                        onClick={() => activeContact && setActiveCall({ peerId: activeContact.id, peerName: activeContact.name || activeContact.email, peerAvatar: activeContact.profile_photo_url, callType: 'audio', direction: 'outgoing' })}>
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon"
                        className="h-9 w-9 rounded-xl hover:text-blue-500 hover:bg-blue-500/10 hidden md:inline-flex"
                        title="Video call"
                        onClick={() => activeContact && setActiveCall({ peerId: activeContact.id, peerName: activeContact.name || activeContact.email, peerAvatar: activeContact.profile_photo_url, callType: 'video', direction: 'outgoing' })}>
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary hover:bg-primary/10">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Connection banner */}
            <ConnectionStatus className="mx-4 mt-2" />

            {/* ── Pinned message banner ── */}
            {pinnedMsg && (
                <div className="flex items-center gap-3 px-4 py-2 bg-primary/8 border-b border-primary/20 animate-fade-in shrink-0">
                    <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-primary font-semibold mb-0.5">Pinned message</p>
                        <p className="text-xs text-foreground truncate">{pinnedMsg.content || '📎 File'}</p>
                    </div>
                    <button onClick={() => chatKey && pinMessage(chatKey, null)}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* ── Forward modal ── */}
            {forwardMsg && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    onClick={() => setForwardMsg(null)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm bg-card rounded-3xl border border-border/50 shadow-2xl animate-scale-in overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                            <div>
                                <h3 className="font-bold text-sm">Forward message</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                                    &ldquo;{forwardMsg.content?.substring(0, 60) || 'File'}&rdquo;
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setForwardMsg(null)}
                                className="h-8 w-8 rounded-xl"><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="max-h-72 overflow-y-auto py-2">
                            {contacts.map(c => (
                                <button key={c.id} onClick={() => doForward(c.id)}
                                    disabled={forwardingTo === c.id}
                                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-all">
                                    <Avatar className="h-10 w-10 border border-border/30 shrink-0">
                                        <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                            {(c.name || c.email).substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="font-semibold text-sm truncate">{c.name || c.email}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                                    </div>
                                    {forwardingTo === c.id
                                        ? <Check className="h-4 w-4 text-emerald-500 animate-scale-in shrink-0" />
                                        : <Forward className="h-4 w-4 text-muted-foreground shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Messages ── */}
            <div ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-5 space-y-0.5 chat-bg">

                {/* Date stamp */}
                <div className="flex justify-center mb-5">
                    <span className="px-3 py-1 rounded-full bg-muted/50 backdrop-blur-sm text-[11px] text-muted-foreground border border-border/30">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-4 pb-2">
                        <MessageSkeleton isMe={false} />
                        <MessageSkeleton isMe={true} />
                        <MessageSkeleton isMe={false} />
                    </div>
                )}

                {/* Grouped message bubbles */}
                {grouped.map(({ msg, isFirst, isLast }, idx) => {
                    const isMe = msg.sender === 'me'
                    const isLastMsg = idx === grouped.length - 1
                    const isLastRead = msg.id === lastReadMsgId

                    return (
                        <div key={msg.id} className={cn(
                            "animate-message-in",
                            isFirst && idx > 0 ? "mt-3" : "mt-0.5"
                        )}>
                            <MessageBubble
                                msg={msg}
                                isMe={isMe}
                                isFirstInGroup={isFirst}
                                isLastInGroup={isLast}
                                isLastMsg={isLastMsg}
                                isLastRead={isLastRead}
                                contactName={contactName}
                                contactAvatarSrc={contactAvatar}
                                onReact={handleReact}
                                reactions={reactions}
                                onPin={handlePin}
                                onForward={handleForward}
                                isPinned={pinnedMsgId === msg.id}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    )
                })}

                {/* Typing indicator */}
                <TypingIndicator userName={activeContact?.name || 'User'} />
            </div>

            {/* ── Input bar ── */}
            <div className="px-4 py-3 bg-card/90 backdrop-blur-sm border-t border-border/40 shrink-0">

                {/* ── Edit mode bar ── */}
                {editingMsg ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-primary">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="font-medium">Editing message</span>
                            <button onClick={handleCancelEdit} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-background rounded-full border border-primary/40 px-3 py-1.5 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] transition-all">
                            <Input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirmEdit() }
                                    if (e.key === 'Escape') handleCancelEdit()
                                }}
                                autoFocus
                                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-sm h-9 placeholder:text-muted-foreground/60"
                            />
                            <Button size="icon"
                                onClick={handleConfirmEdit}
                                disabled={!inputText.trim()}
                                className="h-8 w-8 rounded-full bg-primary text-white hover:opacity-90 btn-press shrink-0">
                                <Check className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Instagram-style "Message {name}..." bar */
                    <div className="flex items-center gap-2 bg-background rounded-full border border-border/50 px-3 py-1.5 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all">
                        {/* Camera/media */}
                        <FileUpload onFileSelect={handleFileUpload} />

                        {/* Text field */}
                        <Input
                            placeholder={connectionStatus === 'connected'
                                ? `Message ${activeContact?.name?.split(' ')[0] || ''}…`
                                : "Connecting..."}
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={connectionStatus !== 'connected'}
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 text-sm h-9 placeholder:text-muted-foreground/60"
                        />

                        {/* Emoji */}
                        <EmojiPickerComponent onEmojiSelect={(emoji) => setInputText(prev => prev + emoji)} />

                        {/* Send or Voice */}
                        {inputText.trim() ? (
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-full bg-tg-gradient text-white shadow-tg hover:opacity-90 btn-press shrink-0 transition-all"
                                onClick={handleSendMessage}
                                disabled={connectionStatus !== 'connected'}
                            >
                                <Send className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onDoubleClick={() => {/* heart reaction shortcut */ }}
                                    className="text-primary hover:scale-125 transition-transform text-lg leading-none"
                                    title="Send ❤️"
                                    onClick={() => {
                                        setInputText("❤️")
                                        setTimeout(handleSendMessage, 0)
                                    }}
                                >
                                    <Heart className="h-5 w-5 fill-primary stroke-primary" />
                                </button>
                                <VoiceRecorder onVoiceMessageSend={handleVoiceMessage} />
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    )
}
