"use client"

import * as React from "react"
import { Search, X, UserPlus, Loader2, CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

interface ContactResult {
    id: number
    email: string
    display_name?: string
    profile_photo_url?: string
    about?: string
    already_added?: boolean
}

interface AddContactModalProps {
    open: boolean
    onClose: () => void
    onAdded: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function AddContactModal({ open, onClose, onAdded }: AddContactModalProps) {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<ContactResult[]>([])
    const [isSearching, setIsSearching] = React.useState(false)
    const [adding, setAdding] = React.useState<number | null>(null)
    const [added, setAdded] = React.useState<Set<number>>(new Set())
    const [error, setError] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
        if (open) {
            setQuery("")
            setResults([])
            setError("")
            setAdded(new Set())
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    const doSearch = async (q: string) => {
        if (!q.trim() || q.length < 2) { setResults([]); return }
        setIsSearching(true)
        setError("")
        try {
            const res = await api.get(`/chat/search-users?q=${encodeURIComponent(q)}`)
            setResults(res.data || [])
            if (res.data.length === 0) setError("No users found")
        } catch {
            // Fallback: try adding directly if search not supported
            setResults([])
            setError("Search not available — try adding by full email below")
        } finally { setIsSearching(false) }
    }

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        setError("")
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 400)
    }

    const handleAddByEmail = async () => {
        if (!query.trim()) return
        setAdding(-1)
        try {
            await api.post("/chat/contacts", { email: query.trim() })
            onAdded()
            onClose()
        } catch {
            setError("Couldn't add contact. Check the email and try again.")
        } finally { setAdding(null) }
    }

    const handleAdd = async (contact: ContactResult) => {
        setAdding(contact.id)
        try {
            await api.post("/chat/contacts", { email: contact.email })
            setAdded(prev => new Set(prev).add(contact.id))
            onAdded()
        } catch {
            setError("Failed to add contact")
        } finally { setAdding(null) }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter' && results.length === 0 && query.includes('@')) handleAddByEmail()
    }

    if (!open) return null

    return (
        /* Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/40">
                    <div className="flex-1">
                        <h2 className="font-bold text-lg">New Message</h2>
                        <p className="text-xs text-muted-foreground">Search by name or email</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search bar */}
                <div className="px-4 py-3">
                    <div className="flex items-center gap-2 bg-muted/40 rounded-2xl px-3 py-2 border border-border/40 focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] transition-all">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={handleQueryChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search people or enter email…"
                            className="border-0 bg-transparent h-8 px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                        />
                        {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                        {query && !isSearching && (
                            <button onClick={() => { setQuery(""); setResults([]); setError(""); inputRef.current?.focus() }}
                                className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="px-4 pb-4 space-y-1 max-h-72 overflow-y-auto">
                    {results.map(contact => {
                        const isAdded = added.has(contact.id)
                        const isAdding = adding === contact.id
                        return (
                            <div key={contact.id}
                                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/40 transition-all">
                                <Avatar className="h-11 w-11 border border-border/30 shrink-0">
                                    <AvatarImage src={contact.profile_photo_url
                                        ? `${API_BASE}${contact.profile_photo_url}`
                                        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.email}`} />
                                    <AvatarFallback className="bg-tg-gradient text-white text-sm font-semibold">
                                        {(contact.display_name || contact.email).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">
                                        {contact.display_name || contact.email.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                                    {contact.about && (
                                        <p className="text-xs text-muted-foreground/70 truncate">{contact.about}</p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    disabled={isAdding || isAdded || contact.already_added}
                                    onClick={() => handleAdd(contact)}
                                    className={cn(
                                        "rounded-xl h-8 px-3 text-xs font-semibold shrink-0 transition-all",
                                        isAdded || contact.already_added
                                            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                                            : "bg-tg-gradient text-white shadow-tg hover:opacity-90"
                                    )}>
                                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : isAdded || contact.already_added
                                            ? <><CheckCircle className="h-3.5 w-3.5 mr-1" />Added</>
                                            : <><UserPlus className="h-3.5 w-3.5 mr-1" />Add</>}
                                </Button>
                            </div>
                        )
                    })}

                    {/* Error / no results */}
                    {error && (
                        <div className="px-3 py-4 text-center">
                            <p className="text-sm text-muted-foreground">{error}</p>
                            {query.includes('@') && (
                                <Button size="sm" onClick={handleAddByEmail} disabled={adding === -1}
                                    className="mt-3 bg-tg-gradient text-white rounded-xl shadow-tg hover:opacity-90">
                                    {adding === -1
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
                                    Add "{query}"
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {!query && results.length === 0 && !error && (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <Search className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-sm text-muted-foreground">Search for people on E-Chat</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Enter a name or full email address</p>
                        </div>
                    )}
                </div>

                {/* Quick add by email footer */}
                {query.includes('@') && results.length === 0 && !isSearching && !error && (
                    <div className="px-4 pb-4">
                        <Button onClick={handleAddByEmail} disabled={adding === -1}
                            className="w-full bg-tg-gradient text-white rounded-2xl shadow-tg hover:opacity-90 h-11 font-semibold">
                            {adding === -1 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Add {query}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
