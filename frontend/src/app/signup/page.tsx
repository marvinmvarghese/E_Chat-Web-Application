"use client"

import Link from "next/link"
import { MessageCircle, Loader2, Eye, EyeOff } from "lucide-react"
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
    const [strength, setStrength] = useState(0)

    useEffect(() => {
        let s = 0
        if (password.length >= 8) s++
        if (/\d/.test(password)) s++
        if (/[^a-zA-Z0-9]/.test(password)) s++
        setStrength(password ? s : 0)
    }, [password])

    const handleSignup = async () => {
        setIsLoading(true); setError("")
        if (password.length < 8) { setError("Password must be at least 8 characters"); setIsLoading(false); return }
        try {
            const res = await api.post("/auth/signup", { email, password })
            const { access_token, user_id, email: userEmail, display_name, profile_photo_url, about } = res.data
            setAuth(access_token, { id: user_id, email: userEmail, display_name, profile_photo_url, about })
            router.push("/chat")
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response) setError(err.response.data.detail || "Signup failed")
            else setError("Something went wrong")
        } finally { setIsLoading(false) }
    }

    const strengthLabel = ["", "Weak", "Fair", "Strong"][strength]
    const strengthColor = ["", "bg-red-500", "bg-amber-400", "bg-emerald-500"][strength]
    const strengthWidth = ["w-0", "w-1/3", "w-2/3", "w-full"][strength]

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                {/* Logo + Title */}
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-tg-gradient flex items-center justify-center shadow-tg">
                        <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Create Account</h1>
                    <p className="text-muted-foreground text-sm">Join free. No credit card needed.</p>
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-6 border border-border/50 shadow-tg-lg space-y-4">
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && email && password.length >= 8 && handleSignup()}
                        className="h-12 rounded-xl border-border/60 bg-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
                        autoComplete="email"
                    />

                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (8+ characters)"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && email && password.length >= 8 && handleSignup()}
                            className="h-12 rounded-xl border-border/60 bg-transparent pr-11 focus-visible:ring-1 focus-visible:ring-primary/50"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Strength bar */}
                    {password.length > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Password strength</span>
                                <span className={
                                    strength === 3 ? "text-emerald-500" :
                                    strength === 2 ? "text-amber-400" : "text-red-500"
                                }>{strengthLabel}</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${strengthWidth}`} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-destructive text-xs text-center bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <Button
                        onClick={handleSignup}
                        disabled={isLoading || !email || password.length < 8}
                        className="w-full h-11 bg-tg-gradient text-white rounded-xl font-semibold shadow-tg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
