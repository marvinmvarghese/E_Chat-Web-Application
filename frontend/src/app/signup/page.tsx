"use client"

import Link from "next/link"
import { MessageCircle, Loader2, Eye, EyeOff, Lock, Mail, UserPlus, Shield, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"

export default function SignupPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordStrength, setPasswordStrength] = useState<"weak"|"medium"|"strong">("weak")
    const [requirements, setRequirements] = useState({ minLength: false, hasNumber: false, hasSpecial: false })

    useEffect(() => {
        const minLength = password.length >= 8
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        setRequirements({ minLength, hasNumber, hasSpecial })

        if (password.length === 0) setPasswordStrength("weak")
        else if (minLength && hasNumber && hasSpecial) setPasswordStrength("strong")
        else if (minLength && (hasNumber || hasSpecial)) setPasswordStrength("medium")
        else setPasswordStrength("weak")
    }, [password])

    const handleSignup = async () => {
        setIsLoading(true); setError("")
        if (password.length < 8) { setError("Password must be at least 8 characters"); setIsLoading(false); return }

        try {
            const res = await api.post("/auth/signup", { email, password })
            const { access_token, user_id, email: userEmail } = res.data
            setAuth(access_token, { id: user_id, email: userEmail })
            router.push("/chat")
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response) setError(err.response.data.detail || "Signup failed")
            else setError("Something went wrong")
        } finally { setIsLoading(false) }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && email && requirements.minLength) handleSignup()
    }

    const strengthColor = passwordStrength === "strong" ? "bg-emerald-500" : passwordStrength === "medium" ? "bg-amber-400" : "bg-red-500"
    const strengthWidth  = passwordStrength === "strong" ? "w-full"          : passwordStrength === "medium" ? "w-2/3"          : "w-1/3"
    const strengthLabel  = { weak: "Weak", medium: "Good", strong: "Strong" }[passwordStrength]

    const Req = ({ ok, label }: { ok: boolean; label: string }) => (
        <div className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? "text-emerald-500" : "text-muted-foreground"}`}>
            {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-50" />}
            {label}
        </div>
    )

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-background">

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-700/8 blur-[100px]" />
            </div>

            {/* Left: form */}
            <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md animate-scale-in">

                    {/* Logo (all screens) */}
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-tg-gradient flex items-center justify-center shadow-tg">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-tg-gradient">E-Chat</span>
                    </div>

                    <div className="glass-card rounded-3xl p-8 shadow-tg-lg border border-border/50">
                        <div className="mb-7">
                            <h2 className="text-3xl font-bold mb-1.5">Create Account</h2>
                            <p className="text-muted-foreground text-sm">Join free. No credit card needed.</p>
                        </div>

                        <div className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </label>
                                <div className="rounded-xl border border-border/60 overflow-hidden transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]">
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="border-0 bg-transparent h-12 px-4 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                                    <Lock className="w-3.5 h-3.5" /> Password
                                </label>
                                <div className="relative rounded-xl border border-border/60 overflow-hidden transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]">
                                    <Input
                                        id="password"
                                        placeholder="Create a strong password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="border-0 bg-transparent h-12 px-4 pr-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Password strength</span>
                                            <span className={`font-semibold ${passwordStrength === "strong" ? "text-emerald-500" : passwordStrength === "medium" ? "text-amber-400" : "text-red-500"}`}>
                                                {strengthLabel}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${strengthColor} ${strengthWidth} rounded-full transition-all duration-300`} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 pt-1">
                                            <Req ok={requirements.minLength} label="8+ chars" />
                                            <Req ok={requirements.hasNumber} label="Number" />
                                            <Req ok={requirements.hasSpecial} label="Symbol" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="text-destructive text-sm text-center bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20 animate-scale-in">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <Button
                                onClick={handleSignup}
                                disabled={isLoading || !email || !requirements.minLength}
                                className="w-full h-12 bg-tg-gradient text-white border-0 rounded-xl text-sm font-semibold shadow-tg hover:opacity-90 transition-all btn-press disabled:opacity-50 mt-2"
                            >
                                {isLoading
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                                    : <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground pt-1">
                                Already have an account?{" "}
                                <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: branding */}
            <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center p-16">
                <div className="max-w-md space-y-10 z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Join thousands of users
                        </div>
                        <h1 className="text-5xl font-extrabold leading-tight">
                            <span className="text-foreground">Start your</span><br />
                            <span className="text-tg-gradient">journey.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Create your account in seconds and dive into real-time, encrypted conversations.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            { icon: UserPlus, label: "One-click sign-up",   sub: "Start chatting in under 30 seconds" },
                            { icon: Shield,   label: "Zero-Knowledge Privacy", sub: "We can't read your messages — ever" },
                        ].map(({ icon: Icon, label, sub }) => (
                            <div key={label} className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm hover-lift transition-all">
                                <div className="w-10 h-10 rounded-xl bg-tg-gradient flex items-center justify-center flex-shrink-0 shadow-tg">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{label}</p>
                                    <p className="text-xs text-muted-foreground">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview bubbles */}
                    <div className="space-y-3 pt-2 opacity-80">
                        <div className="flex justify-end">
                            <div className="bubble-sent px-4 py-2 text-sm text-white max-w-[220px] shadow-tg">
                                Hey! Just signed up 🎉
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bubble-received px-4 py-2 text-sm max-w-[200px]">
                                Welcome to E-Chat! 👋
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
