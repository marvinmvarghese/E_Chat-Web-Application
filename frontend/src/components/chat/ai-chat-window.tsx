"use client"

import * as React from "react"
import { Send, Bot, Sparkles, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/utils"

interface AIMessage {
    id: number
    role: "user" | "assistant"
    content: string
    created_at: string
}

export function AIChatWindow({ className }: { className?: string }) {
    const [messages, setMessages] = React.useState<AIMessage[]>([
        {
            id: 0,
            role: "assistant",
            content: "Hey! I'm **E-Chat AI** 🤖 — your intelligent assistant powered by GPT-4o. Ask me anything: writing, coding, brainstorming, or just a chat!\n\n> Set `OPENAI_API_KEY` in Vercel to unlock full AI power.",
            created_at: new Date().toISOString()
        }
    ])
    const [input, setInput] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [copiedId, setCopiedId] = React.useState<number | null>(null)
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const idCounter = React.useRef(1)

    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages, isLoading])

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: AIMessage = {
            id: idCounter.current++,
            role: "user",
            content: input.trim(),
            created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, userMsg])
        setInput("")
        setIsLoading(true)

        try {
            const history = [...messages, userMsg]
                .filter(m => m.id > 0)
                .map(m => ({ role: m.role, content: m.content }))

            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history })
            })
            const data = await res.json()
            setMessages(prev => [...prev, {
                id: idCounter.current++,
                role: "assistant",
                content: data.reply || "Sorry, I couldn't respond.",
                created_at: new Date().toISOString()
            }])
        } catch {
            setMessages(prev => [...prev, {
                id: idCounter.current++,
                role: "assistant",
                content: "Oops! Something went wrong. Please try again.",
                created_at: new Date().toISOString()
            }])
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleCopy = (id: number, content: string) => {
        navigator.clipboard.writeText(content)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const clearChat = () => {
        setMessages([{
            id: 0, role: "assistant",
            content: "Chat cleared! Start a new conversation 🤖",
            created_at: new Date().toISOString()
        }])
    }

    // Simple markdown renderer (bold, code, line breaks)
    const renderContent = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
            .replace(/\n/g, '<br />')
            .replace(/^> (.+)/gm, '<span class="border-l-2 border-white/40 pl-2 text-white/70 italic">$1</span>')
    }

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/90 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm flex items-center gap-1.5">
                            E-Chat AI
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold">GPT</span>
                        </h3>
                        <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Always available
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearChat}
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Clear chat">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 chat-bg">
                {messages.map(msg => (
                    <div key={msg.id} className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        {/* Avatar */}
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-auto shadow-md">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                        )}

                        <div className={cn("max-w-[78%] flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                            {/* Bubble */}
                            <div className={cn(
                                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                msg.role === "user"
                                    ? "bubble-sent text-white"
                                    : "bg-card border border-border/50 text-foreground"
                            )}>
                                <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                            </div>

                            {/* Actions row */}
                            <div className={cn(
                                "flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                                msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}>
                                <span className="text-[11px] text-muted-foreground">{timeAgo(msg.created_at)}</span>
                                {msg.role === "assistant" && (
                                    <button onClick={() => handleCopy(msg.id, msg.content)}
                                        className="text-muted-foreground hover:text-foreground transition-colors">
                                        {copiedId === msg.id
                                            ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex gap-3 animate-message-in">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="px-4 py-3 bg-card border border-border/50 rounded-2xl">
                            <div className="flex gap-1.5 items-center h-4">
                                <span className="typing-dot w-2 h-2 bg-violet-400 rounded-full" />
                                <span className="typing-dot w-2 h-2 bg-purple-400 rounded-full" />
                                <span className="typing-dot w-2 h-2 bg-blue-400 rounded-full" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-card/90 backdrop-blur-sm border-t border-border/40 shrink-0">
                <div className="flex items-center gap-2 bg-background rounded-full border border-border/50 px-4 py-1.5 focus-within:border-violet-500/50 focus-within:shadow-[0_0_0_3px_rgb(139_92_246/0.1)] transition-all">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask me anything…"
                        disabled={isLoading}
                        className="flex-1 border-0 bg-transparent h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/60"
                    />
                    <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white hover:opacity-90 shadow-md btn-press disabled:opacity-40 shrink-0"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                    E-Chat AI · Powered by GPT-4o · Add <code>OPENAI_API_KEY</code> in Vercel for full access
                </p>
            </div>
        </div>
    )
}
