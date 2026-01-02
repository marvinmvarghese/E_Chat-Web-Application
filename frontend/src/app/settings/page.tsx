"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, User, Palette, Bell, Lock, LogOut, Moon, Sun } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store"
import { useTheme } from "@/components/theme-provider"
import { socketService } from "@/lib/socket"
import api from "@/lib/api"

export default function SettingsPage() {
    const router = useRouter()
    const { user, logout, updateUser } = useAuthStore()
    const { theme, toggleTheme } = useTheme()

    const [profile, setProfile] = useState({
        display_name: "",
        about: "",
        email: "",
        profile_photo_url: null as string | null
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        fetchProfile()
    }, [])

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
        } catch (error) {
            console.error("Failed to fetch profile", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true)
            setMessage("")

            const res = await api.put("/profile/me", {
                display_name: profile.display_name,
                about: profile.about
            })

            // Update the user in the auth store so changes reflect everywhere
            updateUser({
                display_name: res.data.display_name,
                about: res.data.about
            })

            // Broadcast profile update to all contacts via Socket.IO
            socketService.emitProfileUpdate({
                display_name: res.data.display_name,
                about: res.data.about,
                profile_photo_url: profile.profile_photo_url
            })

            setMessage("Profile updated successfully!")
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Failed to update profile", error)
            setMessage("Failed to update profile")
        } finally {
            setIsSaving(false)
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setMessage("Please select an image file")
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage("Image must be less than 5MB")
            return
        }

        try {
            setIsLoading(true)
            const formData = new FormData()
            formData.append("file", file)

            const res = await api.post("/profile/photo", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })

            setProfile(prev => ({
                ...prev,
                profile_photo_url: res.data.profile_photo_url
            }))

            // Update the user in the auth store so photo shows everywhere
            updateUser({
                profile_photo_url: res.data.profile_photo_url
            })

            // Broadcast profile update to contacts
            socketService.emitProfileUpdate({
                display_name: profile.display_name,
                about: profile.about,
                profile_photo_url: res.data.profile_photo_url
            })

            setMessage("Profile photo updated!")
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Failed to upload photo", error)
            setMessage("Failed to upload photo")
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    const handleBack = () => {
        router.push("/chat")
    }

    if (isLoading && !profile.email) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[hsl(var(--whatsapp-dark-green))] text-white p-4 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Settings</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Success/Error Message */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes("success")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                        {message}
                    </div>
                )}

                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>
                            Manage your profile information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Profile Photo */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24 border-4 border-border">
                                    <AvatarImage
                                        src={profile.profile_photo_url
                                            ? `http://localhost:8000${profile.profile_photo_url}`
                                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`
                                        }
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {profile.display_name?.substring(0, 2).toUpperCase() || "ME"}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="photo-upload"
                                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 shadow-lg"
                                >
                                    <Camera className="h-4 w-4" />
                                    <input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </label>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{profile.display_name || "Set your name"}</h3>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Display Name</label>
                            <Input
                                value={profile.display_name}
                                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                                placeholder="Enter your name"
                                className="max-w-md"
                            />
                        </div>

                        {/* About */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">About</label>
                            <Input
                                value={profile.about}
                                onChange={(e) => setProfile(prev => ({ ...prev, about: e.target.value }))}
                                placeholder="Hey there! I am using E-Chat"
                                className="max-w-md"
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be visible to your contacts
                            </p>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                value={profile.email}
                                disabled
                                className="max-w-md bg-muted"
                            />
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-[hsl(var(--whatsapp-green))] hover:bg-[hsl(var(--whatsapp-green))]/90"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                        <CardDescription>
                            Customize how E-Chat looks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Theme</h3>
                                <p className="text-sm text-muted-foreground">
                                    {theme === "dark" ? "Dark mode" : "Light mode"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleTheme}
                                className="h-10 w-10"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                        <CardDescription>
                            Manage notification preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Message notifications</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get notified about new messages
                                </p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Sound</h3>
                                <p className="text-sm text-muted-foreground">
                                    Play sound for notifications
                                </p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Privacy & Security
                        </CardTitle>
                        <CardDescription>
                            Control your privacy settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Last seen</h3>
                                <p className="text-sm text-muted-foreground">
                                    Show when you were last online
                                </p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">Profile photo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Who can see your profile photo
                                </p>
                            </div>
                            <select className="border rounded px-3 py-1 text-sm">
                                <option>Everyone</option>
                                <option>My contacts</option>
                                <option>Nobody</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Logout Section */}
                <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                        <Button
                            variant="destructive"
                            onClick={handleLogout}
                            className="w-full"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </CardContent>
                </Card>

                {/* App Info */}
                <div className="text-center text-sm text-muted-foreground py-4">
                    <p>E-Chat v2.0</p>
                    <p className="mt-1">Secure Real-Time Messaging</p>
                </div>
            </div>
        </div>
    )
}
