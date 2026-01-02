"use client"

import * as React from "react"
import { Phone, Video, Search, MoreVertical, Paperclip, Send, Smile, Mic, Image as ImageIcon, Check, CheckCheck, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useChatStore, useAuthStore, getChatKey, Message } from "@/lib/store"
import api from "@/lib/api"
import { socketService } from "@/lib/socket"
import { ConnectionStatus } from "@/components/connection-status"

export function ChatWindow({ className }: { className?: string }) {
    const { activeId, activeType, messages, setMessages, contacts, setActiveChat, connectionStatus } = useChatStore()
    const { user } = useAuthStore()
    const [inputText, setInputText] = React.useState("")
    const scrollRef = React.useRef<HTMLDivElement>(null)

    const activeContact = activeType === 'contact' ? contacts.find(c => c.id === activeId) : null;
    const chatKey = activeId && activeType ? getChatKey(activeId, activeType) : null;
    const currentMessages = chatKey ? (messages[chatKey] || []) : [];

    React.useEffect(() => {
        if (activeId && activeType) {
            fetchHistory(activeId, activeType);
        }
    }, [activeId, activeType])

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentMessages]);

    const fetchHistory = async (id: number, type: 'contact' | 'group') => {
        try {
            const isGroup = type === 'group';
            const res = await api.get(`/chat/history/${id}?is_group=${isGroup}`);
            const mapped: Message[] = res.data.map((m: any) => ({
                id: m.id,
                content: m.content,
                sender_id: m.sender_id,
                receiver_id: m.receiver_id,
                group_id: m.group_id,
                created_at: m.created_at,
                status: m.status,
                file_url: m.file_url,
                file_name: m.file_name,
                sender: m.sender_id === user?.id ? 'me' : 'them'
            }));

            if (chatKey) {
                setMessages(chatKey, mapped);
            }
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    }

    const handleSendMessage = () => {
        if (!inputText.trim() || !activeId) return;

        const payload: any = {
            type: "text",
            content: inputText,
        };

        if (activeType === 'group') {
            payload.group_id = activeId;
        } else {
            payload.receiver_id = activeId;
        }

        socketService.sendMessage(payload);
        setInputText("");
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    }

    // Back button handler for mobile
    const handleBack = () => {
        // We pass 0 or null, but our store expects ID.
        // We need a clearActiveChat method in store or just pass 0/null if allowed.
        // Store interface: setActiveChat: (id: number, type: 'contact' | 'group') => void;
        // We should probably allow null. Or update store. 
        // For now, let's update store interface in a separate step or just cast.
        // Actually, checking store.ts: activeId: number | null.
        // setActiveChat expects number.
        // I'll update store.ts quickly or just cheat and pass 0?
        // Let's cheat and cast 0 as number, knowing check is !activeId
        useChatStore.setState({ activeId: null, activeType: null });
    }

    if (!activeId) {
        return (
            <div className={cn("hidden md:flex flex-col h-full items-center justify-center bg-[#FAFAFA] text-muted-foreground", className)}>
                <div className="h-24 w-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-purple-500/30">E</div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to eChat</h3>
                <p className="max-w-xs text-center text-sm">Select a conversation from the sidebar to start chatting securely.</p>
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col h-full bg-[#FAFAFA]", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 px-4 md:px-6 border-b bg-white shadow-sm md:shadow-none z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Back Button (Mobile Only) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden -ml-2 h-9 w-9 text-muted-foreground hover:text-foreground"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="relative">
                        <Avatar className="h-9 w-9 md:h-10 md:w-10 border border-border/50">
                            <AvatarImage
                                src={activeContact?.profile_photo_url
                                    ? `http://localhost:8000${activeContact.profile_photo_url}`
                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeContact?.email || 'User'}`
                                }
                            />
                            <AvatarFallback>{activeContact?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 border-2 border-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base md:text-lg leading-tight truncate max-w-[150px] md:max-w-md">{activeContact?.name || activeContact?.email || 'Unknown'}</h3>
                        <span className="text-xs text-green-600 font-medium">Active now</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-purple-50 hover:text-primary">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-purple-50 hover:text-primary hidden md:inline-flex">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-purple-50 hover:text-primary">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Connection Status Banner */}
            <ConnectionStatus className="mx-4 mt-2" />

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
            >
                <div className="flex justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground bg-white px-3 py-1 rounded-full shadow-sm border border-border/50">
                        Today, {new Date().toLocaleDateString()}
                    </span>
                </div>

                {currentMessages.map((msg) => {
                    const isMe = msg.sender === "me";
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full gap-2 md:gap-3",
                                isMe ? "justify-end" : "justify-start"
                            )}
                        >
                            {!isMe && (
                                <Avatar className="hidden md:block h-8 w-8 mt-1 border border-border/20">
                                    <AvatarImage
                                        src={activeContact?.profile_photo_url
                                            ? `http://localhost:8000${activeContact.profile_photo_url}`
                                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeContact?.email}`
                                        }
                                    />
                                    <AvatarFallback>{activeContact?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                            )}

                            <div className={cn("max-w-[75%] md:max-w-[65%] group relative", isMe ? "items-end flex flex-col" : "items-start")}>
                                <div
                                    className={cn(
                                        "px-4 py-2.5 md:px-5 md:py-3 shadow-sm text-sm md:text-base",
                                        isMe
                                            ? "bg-[#8B5CF6] text-white rounded-2xl rounded-tr-sm"
                                            : "bg-white text-foreground rounded-2xl rounded-tl-sm border border-border/40"
                                    )}
                                >
                                    <p className="leading-relaxed break-words">{msg.content}</p>
                                    {msg.file_url && (
                                        <div className="mt-2 text-xs underline cursor-pointer hover:opacity-80">
                                            {msg.file_name || 'Attachment'}
                                        </div>
                                    )}
                                </div>

                                <div className={cn(
                                    "flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium",
                                    isMe ? "justify-end" : "justify-start ml-1"
                                )}>
                                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && (
                                        <CheckCheck className="h-3 w-3 text-purple-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-[#FAFAFA]">
                <div className="bg-white rounded-2xl p-1.5 md:p-2 shadow-sm border border-border/60 flex items-center gap-1 md:gap-2 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50 transition-all shadow-purple-500/5">
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-purple-600 h-9 w-9 md:h-10 md:w-10">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hidden md:inline-flex shrink-0 text-muted-foreground hover:text-purple-600 h-10 w-10">
                        <ImageIcon className="h-5 w-5" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1 hidden md:block"></div>

                    <Input
                        placeholder={connectionStatus === 'connected' ? "Message..." : "Connecting..."}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={connectionStatus !== 'connected'}
                        className="flex-1 bg-transparent border-0 focus-visible:ring-0 px-2 text-sm md:text-base placeholder:text-muted-foreground/70 h-9 md:h-10"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-purple-600 h-9 w-9 md:h-10 md:w-10"
                        onClick={inputText && connectionStatus === 'connected' ? handleSendMessage : undefined}
                        disabled={connectionStatus !== 'connected' || !inputText}
                    >
                        {inputText ? <Send className="h-5 w-5 text-purple-600" /> : <Mic className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}
