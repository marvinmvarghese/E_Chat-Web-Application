"use client"

import * as React from "react"
import { Search, Plus, Settings, MessageCircle, Bot, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useChatStore, Contact, useAuthStore } from "@/lib/store"
import { AddContactModal } from "@/components/chat/add-contact-modal"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function ChatSidebar({ className }: { className?: string }) {
    const { contacts, setContacts, setActiveChat, activeId, activeType, isAIChat, setIsAIChat } = useChatStore()
    const { user } = useAuthStore()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = React.useState("")
    const [showAddModal, setShowAddModal] = React.useState(false)

    React.useEffect(() => {
        fetchContacts()
        const interval = setInterval(fetchContacts, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchContacts = async () => {
        try {
            const res = await api.get("/chat/contacts")
            const mapped: Contact[] = res.data.map((c: { id: number; email: string; display_name?: string; profile_photo_url?: string; about?: string }) => ({
                id: c.id, email: c.email,
                name: c.display_name || c.email.split('@')[0],
                status: 'offline', profile_photo_url: c.profile_photo_url, about: c.about
            }))
            setContacts(mapped)
        } catch (error) { console.error("Failed to fetch contacts", error) }
    }

    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const avatarSrc = (email?: string, url?: string) =>
        url ? `${API_BASE}${url}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'user'}`

    const handleSelectContact = (id: number) => {
        setIsAIChat(false)
        setActiveChat(id, 'contact')
    }

    const handleSelectAI = () => {
        setIsAIChat(true)
        useChatStore.setState({ activeId: -1, activeType: null })
    }

    const isContactActive = (id: number) => !isAIChat && activeId === id && activeType === 'contact'
    const isAIActive = isAIChat && activeId === -1

    return (
        <div className={cn("flex flex-col h-full bg-card border-r border-border/50", className)}>

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border/50 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-tg-gradient flex items-center justify-center shadow-tg shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-tg-gradient flex-1">E-Chat</span>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon"
                        onClick={() => setShowAddModal(true)}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                        title="New chat">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon"
                        onClick={() => router.push("/settings")}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                        title="Settings">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border/30">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input type="search" placeholder="Search chats…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl text-sm" />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-1">

                {/* ── AI Bot entry ── */}
                {!searchTerm && (
                    <button onClick={handleSelectAI}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-[3px]",
                            isAIActive
                                ? "bg-violet-500/10 border-violet-500"
                                : "border-transparent hover:bg-muted/40"
                        )}>
                        <div className="relative shrink-0">
                            <div className={cn(
                                "h-11 w-11 rounded-2xl flex items-center justify-center shadow-md transition-all",
                                "bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500",
                                isAIActive && "ring-2 ring-violet-400/50"
                            )}>
                                <Bot className="h-6 w-6 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                                <span className={cn("font-semibold text-sm flex items-center gap-1.5",
                                    isAIActive ? "text-violet-400" : "text-foreground")}>
                                    E-Chat AI
                                    <span className="hidden sm:inline px-1.5 py-0.5 text-[9px] rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold">GPT</span>
                                </span>
                                <Sparkles className="h-3 w-3 text-violet-400 shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">AI assistant · Always available</p>
                        </div>
                    </button>
                )}

                {/* ── Contacts ── */}
                {filteredContacts.length === 0 && searchTerm ? (
                    <div className="py-10 text-center px-4">
                        <p className="text-sm text-muted-foreground">No chats matching &ldquo;{searchTerm}&rdquo;</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">No contacts yet</p>
                        <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}
                            className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Contact
                        </Button>
                    </div>
                ) : filteredContacts.map(contact => {
                    const isActive = isContactActive(contact.id)
                    return (
                        <button key={contact.id}
                            onClick={() => handleSelectContact(contact.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-[3px]",
                                isActive ? "bg-primary/10 border-primary" : "border-transparent hover:bg-muted/40"
                            )}>
                            <div className="relative shrink-0">
                                <Avatar className={cn("h-11 w-11 border-2 transition-all",
                                    isActive ? "border-primary/50 shadow-tg" : "border-transparent")}>
                                    <AvatarImage src={avatarSrc(contact.email, contact.profile_photo_url)} />
                                    <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                        {(contact.name || contact.email).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {contact.status === "online" && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full status-online animate-pulse-online" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <span className={cn("font-semibold text-sm truncate",
                                        isActive ? "text-primary" : "text-foreground")}>
                                        {contact.name || contact.email}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {contact.about || "Start a conversation…"}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* User footer */}
            <div className="px-3 py-3 border-t border-border/50 bg-muted/10">
                <button onClick={() => router.push("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-primary/8 transition-all group">
                    <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/40 transition-all">
                            <AvatarImage src={avatarSrc(user?.email, user?.profile_photo_url)} />
                            <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                {(user?.display_name || user?.email || 'Me').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full status-online" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm truncate">{user?.display_name || user?.email?.split('@')[0] || 'You'}</p>
                        <p className="text-xs text-primary font-medium">● Online</p>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
            </div>

            {/* Add Contact Modal */}
            <AddContactModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdded={() => { fetchContacts(); setShowAddModal(false) }}
            />
        </div>
    )
}
