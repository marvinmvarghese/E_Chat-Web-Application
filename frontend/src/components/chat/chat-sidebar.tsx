"use client"

import * as React from "react"
import { Search, Plus, Settings, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useChatStore, Contact, useAuthStore } from "@/lib/store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function ChatSidebar({ className }: { className?: string }) {
    const { contacts, setContacts, setActiveChat, activeId, activeType } = useChatStore()
    const { user } = useAuthStore()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = React.useState("")

    React.useEffect(() => {
        fetchContacts()
        const interval = setInterval(fetchContacts, 10000)
        return () => clearInterval(interval)
    }, [])

    const fetchContacts = async () => {
        try {
            const res = await api.get("/chat/contacts")
            const mapped: Contact[] = res.data.map((c: { id: number; email: string; display_name?: string; profile_photo_url?: string; about?: string }) => ({
                id: c.id,
                email: c.email,
                name: c.display_name || c.email.split('@')[0],
                status: 'offline',
                profile_photo_url: c.profile_photo_url,
                about: c.about
            }))
            setContacts(mapped)
        } catch (error) {
            console.error("Failed to fetch contacts", error)
        }
    }

    const handleAddContact = async () => {
        const email = prompt("Enter email to add:")
        if (!email) return
        try {
            await api.post("/chat/contacts", { email })
            fetchContacts()
        } catch {
            alert("Failed to add contact")
        }
    }

    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const avatarSrc = (email?: string, url?: string) =>
        url ? `${API_BASE}${url}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'user'}`

    return (
        <div className={cn("flex flex-col h-full bg-card border-r border-border/50", className)}>

            {/* ── Header ── */}
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border/50 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-tg-gradient flex items-center justify-center shadow-tg">
                    <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-tg-gradient">E-Chat</span>

                <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleAddContact}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Add contact">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Settings">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="px-4 py-3 border-b border-border/30">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/30 rounded-xl text-sm transition-all"
                    />
                </div>
            </div>

            {/* ── Contact list ── */}
            <div className="flex-1 overflow-y-auto py-2">
                {filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <MessageCircle className="h-7 w-7 text-primary" />
                        </div>
                        <p className="font-semibold text-sm mb-1">No chats yet</p>
                        <p className="text-xs text-muted-foreground">Add a contact to start chatting</p>
                        <Button size="sm" variant="outline" onClick={handleAddContact}
                            className="mt-4 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Contact
                        </Button>
                    </div>
                ) : (
                    filteredContacts.map((contact) => {
                        const isActive = activeId === contact.id && activeType === 'contact'
                        return (
                            <button
                                key={contact.id}
                                onClick={() => setActiveChat(contact.id, 'contact')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all outline-none",
                                    isActive
                                        ? "bg-primary/10 border-l-[3px] border-primary"
                                        : "border-l-[3px] border-transparent hover:bg-muted/50"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <Avatar className={cn("h-11 w-11 border-2 transition-all", isActive ? "border-primary/50 shadow-tg" : "border-transparent")}>
                                        <AvatarImage src={avatarSrc(contact.email, contact.profile_photo_url)} />
                                        <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                            {(contact.name || contact.email).substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {contact.status === "online" && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full status-online animate-pulse-online" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("font-semibold text-sm truncate", isActive ? "text-primary" : "text-foreground")}>
                                            {contact.name || contact.email}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">now</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground truncate">
                                            {contact.about || "Start a conversation..."}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>

            {/* ── User footer ── */}
            <div className="px-3 py-3 border-t border-border/50 bg-muted/20">
                <button
                    onClick={() => router.push("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-primary/8 transition-all group"
                >
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
        </div>
    )
}
