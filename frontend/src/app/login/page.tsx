"use client"

import Link from "next/link"
import { MessageCircle, Loader2, Eye, EyeOff, Lock, Mail, Shield, Zap } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"

export default function LoginPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordError, setPasswordError] = useState("")

    const validatePassword = (pwd: string) => {
        if (pwd.length > 0 && pwd.length < 8) {
            setPasswordError("Password must be at least 8 characters")
            return false
        }
        setPasswordError("")
        return true
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pwd = e.target.value
        setPassword(pwd)
        validatePassword(pwd)
    }

    const handleLogin = async () => {
        setIsLoading(true)
        setError("")
        if (!validatePassword(password)) { setIsLoading(false); return }

        try {
            const res = await api.post("/auth/login", { email, password })
            const { access_token, user_id, email: userEmail, display_name, profile_photo_url, about } = res.data
            setAuth(access_token, { id: user_id, email: userEmail, display_name, profile_photo_url, about })
            router.push("/chat")
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || "Login failed")
            } else {
                setError("Something went wrong")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && email && password && !passwordError) handleLogin()
    }

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-background">

            {/* ── Background blobs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
            </div>

            {/* ── Left branding panel ── */}
            <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center p-16">
                <div className="max-w-md space-y-10 z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-tg-gradient flex items-center justify-center shadow-tg-lg">
                            <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-tg-gradient">E-Chat</span>
                    </div>

                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            v2.0 — Voice • Files • Groups
                        </div>
                        <h1 className="text-5xl font-extrabold leading-tight">
                            <span className="text-foreground">Welcome</span><br />
                            <span className="text-tg-gradient">back.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Your secure messaging hub. Fast, private, and beautifully crafted for real conversations.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="space-y-3">
                        {[
                            { icon: Shield, label: "End-to-End Encrypted", sub: "Military-grade security on every message" },
                            { icon: Zap,    label: "Real-Time Messaging",  sub: "Instant delivery with typing indicators"  },
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
                </div>
            </div>

            {/* ── Right: Login form ── */}
            <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md animate-scale-in">

                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-tg-gradient flex items-center justify-center shadow-tg">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-tg-gradient">E-Chat</span>
                    </div>

                    {/* Card */}
                    <div className="glass-card rounded-3xl p-8 shadow-tg-lg border border-border/50">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold mb-1.5">Sign In</h2>
                            <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
                        </div>

                        <div className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </label>
                                <div className="input-tg rounded-xl border border-border/60 overflow-hidden transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]">
                                    <Input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="border-0 bg-transparent h-12 px-4 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
                                        <Lock className="w-3.5 h-3.5" /> Password
                                    </label>
                                    <Link href="/forgot-password" className="text-xs text-primary hover:underline transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative input-tg rounded-xl border border-border/60 overflow-hidden transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)]">
                                    <Input
                                        id="password"
                                        placeholder="Your password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        onKeyDown={handleKeyPress}
                                        className="border-0 bg-transparent h-12 px-4 pr-11 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                        {passwordError}
                                    </p>
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
                                onClick={handleLogin}
                                disabled={isLoading || !email || !password || !!passwordError}
                                className="w-full h-12 bg-tg-gradient text-white border-0 rounded-xl text-sm font-semibold shadow-tg hover:opacity-90 transition-all btn-press disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                                ) : "Sign In"}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground pt-1">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="font-semibold text-primary hover:underline transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
