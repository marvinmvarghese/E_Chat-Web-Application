"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageCircle, Loader2, Mail, Lock, KeyRound, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import axios from "axios"

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [devOtp, setDevOtp] = useState('')

    const handleSendOtp = async () => {
        setLoading(true); setError('')
        try {
            const res = await api.post('/auth/forgot-password', { email })
            if (res.data.otp) setDevOtp(res.data.otp)
            setStep('otp')
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.detail || 'Failed to send OTP') : 'Something went wrong')
        } finally { setLoading(false) }
    }

    const handleVerifyOtp = async () => {
        setLoading(true); setError('')
        try {
            const res = await api.post('/auth/verify-otp', { email, otp })
            setResetToken(res.data.reset_token)
            setStep('password')
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.detail || 'Invalid OTP') : 'Something went wrong')
        } finally { setLoading(false) }
    }

    const handleResetPassword = async () => {
        setLoading(true); setError('')
        try {
            await api.post('/auth/reset-password', { reset_token: resetToken, new_password: newPassword })
            setStep('done')
        } catch (err: unknown) {
            setError(axios.isAxiosError(err) ? (err.response?.data?.detail || 'Reset failed') : 'Something went wrong')
        } finally { setLoading(false) }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-tg-gradient flex items-center justify-center shadow-tg">
                        <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Reset Password</h1>
                    <p className="text-muted-foreground text-sm text-center">
                        {step === 'email' && 'Enter your email to receive a one-time code.'}
                        {step === 'otp'   && `Enter the 6-digit code sent to ${email}`}
                        {step === 'password' && 'Choose a new password for your account.'}
                        {step === 'done'  && 'Your password has been reset successfully.'}
                    </p>
                </div>

                {step !== 'done' && (
                    <div className="glass-card rounded-2xl p-6 border border-border/50 shadow-tg-lg space-y-4">
                        {step === 'email' && (<>
                            <div className="relative rounded-xl border border-border/60 focus-within:border-primary/50 transition-all">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="name@example.com" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && email && handleSendOtp()}
                                    className="border-0 bg-transparent h-12 pl-9 focus-visible:ring-0" />
                            </div>
                            <Button onClick={handleSendOtp} disabled={!email || loading}
                                className="w-full h-11 bg-tg-gradient text-white rounded-xl font-semibold">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
                            </Button>
                        </>)}

                        {step === 'otp' && (<>
                            {devOtp && (
                                <div className="text-xs text-center text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg">
                                    Dev mode — your OTP: <strong>{devOtp}</strong>
                                </div>
                            )}
                            <div className="relative rounded-xl border border-border/60 focus-within:border-primary/50 transition-all">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="text" maxLength={6} placeholder="6-digit code" value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                                    className="border-0 bg-transparent h-12 pl-9 tracking-widest text-center text-lg font-bold focus-visible:ring-0" />
                            </div>
                            <Button onClick={handleVerifyOtp} disabled={otp.length !== 6 || loading}
                                className="w-full h-11 bg-tg-gradient text-white rounded-xl font-semibold">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Code'}
                            </Button>
                            <button type="button" onClick={() => { setStep('email'); setError('') }}
                                className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                                ← Back
                            </button>
                        </>)}

                        {step === 'password' && (<>
                            <div className="relative rounded-xl border border-border/60 focus-within:border-primary/50 transition-all">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type={showPassword ? 'text' : 'password'} placeholder="New password (8+ chars)"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && newPassword.length >= 8 && handleResetPassword()}
                                    className="border-0 bg-transparent h-12 pl-9 pr-10 focus-visible:ring-0" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <Button onClick={handleResetPassword} disabled={newPassword.length < 8 || loading}
                                className="w-full h-11 bg-tg-gradient text-white rounded-xl font-semibold">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set New Password'}
                            </Button>
                        </>)}

                        {error && <p className="text-destructive text-xs text-center bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                    </div>
                )}

                {step === 'done' && (
                    <div className="glass-card rounded-2xl p-8 border border-border/50 shadow-tg-lg text-center space-y-4">
                        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                        <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
                        <Button onClick={() => router.push('/login')}
                            className="w-full h-11 bg-tg-gradient text-white rounded-xl font-semibold">
                            Go to Login
                        </Button>
                    </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-6">
                    Remember it? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    )
}
