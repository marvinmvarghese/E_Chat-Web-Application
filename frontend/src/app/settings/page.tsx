"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft, Camera, User, Palette, Bell, Lock, LogOut,
    Moon, Sun, Check, Edit2, MessageCircle, Shield, ChevronRight, Loader2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/store"
import { useTheme } from "@/components/theme-provider"
import { socketService } from "@/lib/socket"
import api from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function SettingsPage() {
    const router = useRouter()
    const { user, logout, updateUser } = useAuthStore()
    const { theme, toggleTheme } = useTheme()

    const [profile, setProfile] = useState({
        display_name: "", about: "", email: "", profile_photo_url: null as string | null
    })
    const [editingName, setEditingName] = useState(false)
    const [editingAbout, setEditingAbout] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(false)
    const nameRef = useRef<HTMLInputElement>(null)
    const aboutRef = useRef<HTMLInputElement>(null)

    useEffect(() => { fetchProfile() }, [])
    useEffect(() => { if (editingName) nameRef.current?.focus() }, [editingName])
    useEffect(() => { if (editingAbout) aboutRef.current?.focus() }, [editingAbout])

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const res = await api.get("/profile/me")
            setProfile({
                display_name: res.data.display_name || "",
                about: res.data.about || "",
                email: res.data.email || "",
                profile_photo_url: res.data.profile_photo_url
            })
        } catch { console.error("Failed to fetch profile") }
        finally { setIsLoading(false) }
    }

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true)
            const res = await api.put("/profile/me", {
                display_name: profile.display_name,
                about: profile.about
            })
            updateUser({ display_name: res.data.display_name, about: res.data.about })
            socketService.emitProfileUpdate({
                display_name: res.data.display_name,
                about: res.data.about,
                profile_photo_url: profile.profile_photo_url
            })
            setEditingName(false)
            setEditingAbout(false)
            showToast("Profile saved!")
        } catch { showToast("Failed to save profile", false) }
        finally { setIsSaving(false) }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) { showToast("Please select an image", false); return }
        if (file.size > 5 * 1024 * 1024) { showToast("Max 5MB", false); return }

        try {
            setUploadProgress(true)
            const formData = new FormData()
            formData.append("file", file)
            const res = await api.post("/profile/photo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            setProfile(prev => ({ ...prev, profile_photo_url: res.data.profile_photo_url }))
            updateUser({ profile_photo_url: res.data.profile_photo_url })
            socketService.emitProfileUpdate({
                display_name: profile.display_name,
                about: profile.about,
                profile_photo_url: res.data.profile_photo_url
            })
            showToast("Photo updated!")
        } catch { showToast("Failed to upload photo", false) }
        finally { setUploadProgress(false) }
    }

    const avatarSrc = profile.profile_photo_url
        ? `${API_BASE}${profile.profile_photo_url}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`

    if (isLoading && !profile.email) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-tg-gradient flex items-center justify-center animate-pulse shadow-tg">
                        <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading settings…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg animate-scale-in",
                    toast.ok ? "bg-emerald-500 text-white" : "bg-destructive text-destructive-foreground"
                )}>
                    {toast.ok && <Check className="inline h-3.5 w-3.5 mr-1.5" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border/50 px-4 h-16 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}
                    className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold">Settings</h1>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-3">

                {/* ── Profile card ── */}
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
                    {/* Photo + identity */}
                    <div className="flex items-center gap-5 p-6 border-b border-border/40">
                        <div className="relative group shrink-0">
                            <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-tg">
                                <AvatarImage src={avatarSrc} />
                                <AvatarFallback className="bg-tg-gradient text-white text-2xl font-bold">
                                    {(profile.display_name || profile.email).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <label htmlFor="photo-upload"
                                className={cn(
                                    "absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition-all",
                                    "bg-black/0 group-hover:bg-black/40",
                                    uploadProgress && "bg-black/40"
                                )}>
                                {uploadProgress
                                    ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    : <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                }
                                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                            {/* Online dot */}
                            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full status-online border-2 border-background" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xl truncate">
                                {profile.display_name || "Set your name"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                            <p className="text-xs text-primary mt-0.5 font-medium">● Online</p>
                        </div>
                    </div>

                    {/* Editable: Display Name */}
                    <div className="px-6 py-4 border-b border-border/30">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Display Name</p>
                        <div className="flex items-center gap-2">
                            {editingName ? (
                                <Input
                                    ref={nameRef}
                                    value={profile.display_name}
                                    onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveProfile(); if (e.key === 'Escape') setEditingName(false) }}
                                    placeholder="Your display name"
                                    className="h-9 text-sm border-primary/40 focus-visible:ring-primary/30 rounded-xl"
                                />
                            ) : (
                                <span className="flex-1 text-sm text-foreground">
                                    {profile.display_name || <span className="text-muted-foreground italic">Not set</span>}
                                </span>
                            )}
                            <Button variant="ghost" size="icon"
                                onClick={() => editingName ? handleSaveProfile() : setEditingName(true)}
                                className="h-8 w-8 rounded-xl hover:bg-primary/10 shrink-0">
                                {editingName
                                    ? (isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />)
                                    : <Edit2 className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                    </div>

                    {/* Editable: About */}
                    <div className="px-6 py-4">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">About</p>
                        <div className="flex items-center gap-2">
                            {editingAbout ? (
                                <Input
                                    ref={aboutRef}
                                    value={profile.about}
                                    onChange={e => setProfile(p => ({ ...p, about: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveProfile(); if (e.key === 'Escape') setEditingAbout(false) }}
                                    placeholder="Hey there! I am using E-Chat"
                                    className="h-9 text-sm border-primary/40 focus-visible:ring-primary/30 rounded-xl"
                                />
                            ) : (
                                <span className="flex-1 text-sm text-foreground">
                                    {profile.about || <span className="text-muted-foreground italic">Hey there! I am using E-Chat</span>}
                                </span>
                            )}
                            <Button variant="ghost" size="icon"
                                onClick={() => editingAbout ? handleSaveProfile() : setEditingAbout(true)}
                                className="h-8 w-8 rounded-xl hover:bg-primary/10 shrink-0">
                                {editingAbout
                                    ? (isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />)
                                    : <Edit2 className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">Visible to your contacts</p>
                    </div>
                </div>

                {/* ── Appearance ── */}
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
                    <div className="px-6 py-3 border-b border-border/30">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Appearance</p>
                    </div>
                    <button onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-all">
                        <div className="flex items-center gap-3">
                            {theme === "dark"
                                ? <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center"><Moon className="h-4.5 w-4.5 text-blue-300" /></div>
                                : <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><Sun className="h-4.5 w-4.5 text-amber-500" /></div>
                            }
                            <div className="text-left">
                                <p className="text-sm font-medium">Theme</p>
                                <p className="text-xs text-muted-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                            </div>
                        </div>
                        <div className={cn(
                            "w-11 h-6 rounded-full transition-colors relative",
                            theme === "dark" ? "bg-primary" : "bg-muted"
                        )}>
                            <div className={cn(
                                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                                theme === "dark" ? "translate-x-5.5" : "translate-x-0.5"
                            )} />
                        </div>
                    </button>
                </div>

                {/* ── Notifications ── */}
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
                    <div className="px-6 py-3 border-b border-border/30">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Notifications</p>
                    </div>
                    {[
                        { label: "Message notifications", sub: "Sound and banners for new messages", checked: true },
                        { label: "Notification sounds", sub: "Play sound when message arrives", checked: true },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-border/20 last:border-0">
                            <div className="flex items-center gap-3">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                                </div>
                            </div>
                            <label className="relative cursor-pointer">
                                <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                                <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                            </label>
                        </div>
                    ))}
                </div>

                {/* ── Privacy ── */}
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden">
                    <div className="px-6 py-3 border-b border-border/30">
                        <p className="text-xs text-primary font-semibold uppercase tracking-wider">Privacy & Security</p>
                    </div>
                    {[
                        { icon: Shield, label: "Last seen", sub: "Show when you were last online" },
                        { icon: User, label: "Profile photo", sub: "Everyone can see your photo" },
                        { icon: Lock, label: "Read receipts", sub: "Let contacts see when you read" },
                    ].map((item, i) => (
                        <button key={i} className="w-full flex items-center justify-between px-6 py-4 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <item.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                </div>

                {/* ── App info ── */}
                <div className="bg-card rounded-3xl border border-border/50 px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tg-gradient flex items-center justify-center shadow-tg">
                        <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">E-Chat v2.0</p>
                        <p className="text-xs text-muted-foreground">Secure · Private · Fast</p>
                    </div>
                </div>

                {/* ── Logout ── */}
                {!showLogoutConfirm ? (
                    <button onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-6 py-4 bg-card rounded-3xl border border-destructive/30 hover:bg-destructive/5 transition-all text-destructive">
                        <LogOut className="h-5 w-5" />
                        <span className="font-semibold text-sm">Log Out</span>
                    </button>
                ) : (
                    <div className="bg-card rounded-3xl border border-destructive/50 px-6 py-5 space-y-3 animate-scale-in">
                        <p className="text-sm font-medium text-center">Log out of E-Chat?</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowLogoutConfirm(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" className="flex-1 rounded-2xl"
                                onClick={() => { logout(); router.push("/login") }}>
                                Log Out
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
