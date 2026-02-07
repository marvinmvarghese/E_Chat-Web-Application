"use client"

import Link from "next/link"
import { ShieldCheck, Loader2, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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

        // Validate password before submitting
        if (!validatePassword(password)) {
            setIsLoading(false)
            return
        }

        try {
            const res = await api.post("/auth/login", { email, password })
            const { access_token, user_id, email: userEmail } = res.data

            setAuth(access_token, { id: user_id, email: userEmail })
            router.push("/chat")
        } catch (err: any) {
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
        if (e.key === "Enter" && email && password && !passwordError) {
            handleLogin()
        }
    }

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="max-w-lg space-y-8 z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">v2.0 Now Available</span>
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                            Welcome back to E-Chat
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed">
                            Your secure messaging platform with end-to-end encryption. Connect with friends, family, and colleagues instantly.
                        </p>
                    </div>

                    <div className="space-y-4 pt-8">
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">End-to-End Encryption</h3>
                                <p className="text-sm text-zinc-400">Your messages are secured with military-grade encryption</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <Lock className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Privacy First</h3>
                                <p className="text-sm text-zinc-400">We never store or share your personal data</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
                <Card className="w-full max-w-md border-opacity-20 bg-white/5 backdrop-blur-xl shadow-2xl border-white/10">
                    <CardHeader className="space-y-3">
                        <div className="flex justify-center lg:hidden mb-2">
                            <div className="inline-flex items-center justify-center rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/30">
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Secure Encrypted Chat
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent text-center lg:text-left">
                            Sign In
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-center lg:text-left">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all hover:bg-black/30 h-11"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Password
                                </label>
                                <Link
                                    href="#"
                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    placeholder="Enter your password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onKeyPress={handleKeyPress}
                                    className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all hover:bg-black/30 h-11 pr-10"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                    <span className="w-1 h-1 rounded-full bg-red-400"></span>
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1 duration-300">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            onClick={handleLogin}
                            disabled={isLoading || !email || !password || !!passwordError}
                            className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] h-11 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                        <div className="text-center text-sm text-zinc-500">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/signup"
                                className="font-medium text-primary hover:text-primary/80 hover:underline transition-all"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
