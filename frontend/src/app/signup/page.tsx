"use client"

import Link from "next/link"
import { ShieldCheck, UserPlus, Loader2, Eye, EyeOff, Lock, Mail, Sparkles, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
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

export default function SignupPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")

    // Password requirements
    const [requirements, setRequirements] = useState({
        minLength: false,
        hasNumber: false,
        hasSpecial: false,
    })

    useEffect(() => {
        // Check password requirements
        const minLength = password.length >= 8
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        setRequirements({
            minLength,
            hasNumber,
            hasSpecial,
        })

        // Calculate strength
        if (password.length === 0) {
            setPasswordStrength("weak")
        } else if (minLength && hasNumber && hasSpecial) {
            setPasswordStrength("strong")
        } else if (minLength && (hasNumber || hasSpecial)) {
            setPasswordStrength("medium")
        } else {
            setPasswordStrength("weak")
        }
    }, [password])

    const handleSignup = async () => {
        setIsLoading(true)
        setError("")

        // Validate password
        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            setIsLoading(false)
            return
        }

        try {
            const res = await api.post("/auth/signup", { email, password })
            const { access_token, user_id, email: userEmail } = res.data

            setAuth(access_token, { id: user_id, email: userEmail })
            router.push("/chat")
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || "Signup failed")
            } else {
                setError("Something went wrong")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && email && password && requirements.minLength) {
            handleSignup()
        }
    }

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case "strong":
                return "bg-green-500"
            case "medium":
                return "bg-yellow-500"
            default:
                return "bg-red-500"
        }
    }

    const getStrengthWidth = () => {
        switch (passwordStrength) {
            case "strong":
                return "w-full"
            case "medium":
                return "w-2/3"
            default:
                return "w-1/3"
        }
    }

    return (
        <div className="relative min-h-screen flex overflow-hidden bg-background">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
                <div className="max-w-lg space-y-8 z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium text-indigo-400">Join E-Chat Today</span>
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                            Start your secure messaging journey
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed">
                            Create your account and experience real-time messaging with military-grade encryption. Your privacy is our priority.
                        </p>
                    </div>

                    <div className="space-y-4 pt-8">
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <UserPlus className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Quick Setup</h3>
                                <p className="text-sm text-zinc-400">Get started in seconds with just your email</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white mb-1">Always Secure</h3>
                                <p className="text-sm text-zinc-400">Your data is encrypted and never shared</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
                <Card className="w-full max-w-md border-opacity-20 bg-white/5 backdrop-blur-xl shadow-2xl border-white/10">
                    <CardHeader className="space-y-3">
                        <div className="flex justify-center lg:hidden mb-2">
                            <div className="inline-flex items-center justify-center rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                Join E-Chat
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent text-center lg:text-left">
                            Create Account
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-center lg:text-left">
                            Start your secure messaging journey today
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
                                className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all hover:bg-black/30 h-11"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    placeholder="Create a strong password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-black/20 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all hover:bg-black/30 h-11 pr-10"
                                    autoComplete="new-password"
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

                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-400">Password strength:</span>
                                        <span className={`font-medium ${passwordStrength === "strong" ? "text-green-400" :
                                                passwordStrength === "medium" ? "text-yellow-400" :
                                                    "text-red-400"
                                            }`}>
                                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${getStrengthColor()} ${getStrengthWidth()} transition-all duration-300`} />
                                    </div>
                                </div>
                            )}

                            {/* Password Requirements */}
                            <div className="space-y-1.5 pt-2">
                                <div className={`flex items-center gap-2 text-xs transition-colors ${requirements.minLength ? "text-green-400" : "text-zinc-500"
                                    }`}>
                                    {requirements.minLength ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                    <span>At least 8 characters</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors ${requirements.hasNumber ? "text-green-400" : "text-zinc-500"
                                    }`}>
                                    {requirements.hasNumber ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                    <span>Contains a number</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors ${requirements.hasSpecial ? "text-green-400" : "text-zinc-500"
                                    }`}>
                                    {requirements.hasSpecial ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                    <span>Contains a special character</span>
                                </div>
                            </div>
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
                            onClick={handleSignup}
                            disabled={isLoading || !email || !password || !requirements.minLength}
                            className="w-full bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-600/90 hover:to-primary/90 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] h-11 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                        <div className="text-center text-sm text-zinc-500">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
