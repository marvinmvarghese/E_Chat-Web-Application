"use client"

import * as React from "react"
import { Search, Plus, Settings, Hash } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog" 
import api from "@/lib/api"
import { useChatStore, Contact, useAuthStore } from "@/lib/store"

export function ChatSidebar({ className }: { className?: string }) {
    const { contacts, setContacts, setActiveChat, activeId, activeType } = useChatStore()
    const { user } = useAuthStore()
    const [searchTerm, setSearchTerm] = React.useState("")

    React.useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        try {
            const res = await api.get("/chat/contacts")
            // backend returns list of { id, email, created_at, ... }
            // We map to our Contact interface
            const mapped: Contact[] = res.data.map((c: any) => ({
                id: c.id,
                email: c.email,
                name: c.email.split('@')[0], // derived name
                status: 'offline' // default
            }));
            setContacts(mapped)
        } catch (error) {
            console.error("Failed to fetch contacts", error)
        }
    }

    const handleAddContact = async () => {
        const email = prompt("Enter email to add:");
        if (!email) return;
        try {
            await api.post("/chat/contacts", { email });
            fetchContacts();
        } catch (e) {
            alert("Failed to add contact");
        }
    }

    const filteredContacts = contacts.filter(c =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className={cn("flex flex-col h-full border-r bg-background", className)}>
            {/* Header */}
            <div className="p-4 pt-6 space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                        E
                    </div>
                    <span className="font-bold text-xl tracking-tight">eChat</span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10 bg-secondary/50 border-0 focus-visible:ring-1 rounded-xl"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {/* Direct Messages Section */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Direct Messages</span>
                        <Plus className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" onClick={handleAddContact} />
                    </div>
                    <div className="space-y-1">
                        {filteredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => setActiveChat(contact.id, 'contact')}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded-xl group",
                                    (activeId === contact.id && activeType === 'contact')
                                        ? "bg-accent/50"
                                        : "hover:bg-secondary/50"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-9 w-9 border border-border/50">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.email}`} />
                                        <AvatarFallback>{contact.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {contact.status === "online" && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "font-medium truncate text-sm",
                                            (activeId === contact.id && activeType === 'contact') ? "text-primary font-semibold" : "text-foreground"
                                        )}>
                                            {contact.name || contact.email}
                                        </span>
                                        {/* Mock unread badge for UI demo match */}
                                        {contact.id === 1 && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white shadow-sm shadow-primary/30">
                                                2
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate block max-w-[140px]">
                                        Start a conversation...
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Channels Section (Mock) */}
                <div>
                    <div className="flex items-center justify-between px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Channels</span>
                        <Plus className="h-3.5 w-3.5 cursor-pointer hover:text-foreground" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                                <Hash className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Design Team</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-all rounded-xl bg-accent/30 text-primary">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Hash className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold">Marketing Channel</span>
                            <span className="ml-auto w-2 h-2 rounded-full bg-primary"></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t bg-background/50 backdrop-blur">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'me'}`} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="font-semibold text-sm truncate">{user?.email?.split('@')[0] || 'John Doe'}</div>
                        <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    )
}
