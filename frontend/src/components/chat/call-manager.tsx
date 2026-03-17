"use client"

import * as React from "react"
import { Phone, PhoneOff, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { socketService } from "@/lib/socket"
import { CallScreen, type CallState } from "@/components/chat/call-screen"
import api from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ── Synthetic ringtone using Web Audio API ──────────────────────────────────
function startRinging(type: 'incoming' | 'outgoing'): () => void {
    let stopped = false

    const ring = () => {
        if (stopped) return
        try {
            const ctx = new AudioContext()
            if (type === 'incoming') {
                // two-tone rising chime
                ;[0, 0.25].forEach((offset, i) => {
                    const osc = ctx.createOscillator()
                    const gain = ctx.createGain()
                    osc.connect(gain); gain.connect(ctx.destination)
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(i === 0 ? 480 : 620, ctx.currentTime + offset)
                    gain.gain.setValueAtTime(0.4, ctx.currentTime + offset)
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.22)
                    osc.start(ctx.currentTime + offset)
                    osc.stop(ctx.currentTime + offset + 0.22)
                })
                setTimeout(() => ctx.close(), 700)
            } else {
                // soft outgoing ring
                const osc = ctx.createOscillator(); const gain = ctx.createGain()
                osc.connect(gain); gain.connect(ctx.destination)
                osc.type = 'sine'; osc.frequency.value = 440
                gain.gain.setValueAtTime(0.18, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
                osc.start(); osc.stop(ctx.currentTime + 0.7)
                setTimeout(() => ctx.close(), 900)
            }
        } catch (_) {}
    }

    ring()
    const interval = setInterval(ring, type === 'incoming' ? 1400 : 3200)
    return () => { stopped = true; clearInterval(interval) }
}

// ── OS notification helper ──────────────────────────────────────────────────
function showCallNotification(callerName: string, callType: 'audio' | 'video') {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => {
            if (p === 'granted') showCallNotification(callerName, callType)
        })
        return
    }
    try {
        const n = new Notification(`📞 Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`, {
            body: `${callerName} is calling you`,
            icon: '/favicon.ico',
            tag: 'incoming-call',
            requireInteraction: true,
        } as NotificationOptions)
        n.onclick = () => { window.focus(); n.close() }
    } catch (_) {}
}

// ── Log call to backend ─────────────────────────────────────────────────────
async function logCall(receiverId: number, callType: string, status: string, duration?: number) {
    try {
        await api.post('/chat/calls', { receiver_id: receiverId, call_type: callType, status, duration })
    } catch (_) {}
}

// ── CallManager ────────────────────────────────────────────────────────────
export function CallManager() {
    const [incomingCall, setIncomingCall] = React.useState<CallState | null>(null)
    const [activeCall, setActiveCall] = React.useState<CallState | null>(null)
    const stopRingRef = React.useRef<(() => void) | null>(null)
    const callStartTimeRef = React.useRef<number | null>(null)

    // Ringtone for incoming calls
    React.useEffect(() => {
        if (incomingCall && !activeCall) {
            stopRingRef.current = startRinging('incoming')
            showCallNotification(incomingCall.peerName, incomingCall.callType)
        }
        return () => {
            stopRingRef.current?.()
            stopRingRef.current = null
        }
    }, [incomingCall, activeCall])

    const stopRing = () => {
        stopRingRef.current?.()
        stopRingRef.current = null
    }

    React.useEffect(() => {
        const handleCallOffer = (data: Record<string, unknown>) => {
            // If we're already in a call, auto-reject
            if (activeCall) {
                socketService.rejectCall(data.caller_id as number)
                return
            }
            setIncomingCall({
                peerId: data.caller_id as number,
                peerName: (data.caller_name as string) || 'Unknown',
                peerAvatar: data.caller_avatar as string | undefined,
                callType: (data.call_type as 'audio' | 'video') || 'audio',
                direction: 'incoming',
                offer: data.offer as RTCSessionDescriptionInit,
            })
        }

        const handleCallEnd = (data: Record<string, unknown>) => {
            stopRing()
            // Log missed if we had an incoming call but never accepted
            if (incomingCall && !activeCall) {
                void logCall(incomingCall.peerId, incomingCall.callType, 'missed')
            }
            if (activeCall) {
                const duration = callStartTimeRef.current
                    ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
                    : undefined
                void logCall(activeCall.peerId, activeCall.callType, 'completed', duration)
            }
            setActiveCall(null)
            setIncomingCall(null)
        }

        const handleCallReject = () => {
            stopRing()
            if (activeCall) void logCall(activeCall.peerId, activeCall.callType, 'rejected')
            setActiveCall(null)
        }

        socketService.onCallEvent('call_offer', handleCallOffer)
        socketService.onCallEvent('call_end', handleCallEnd)
        socketService.onCallEvent('call_reject', handleCallReject)

        return () => {
            socketService.offCallEvent('call_offer', handleCallOffer)
            socketService.offCallEvent('call_end', handleCallEnd)
            socketService.offCallEvent('call_reject', handleCallReject)
        }
    }, [activeCall, incomingCall])

    const handleAccept = () => {
        stopRing()
        if (!incomingCall) return
        callStartTimeRef.current = Date.now()
        setActiveCall(incomingCall)
        setIncomingCall(null)
    }

    const handleReject = () => {
        stopRing()
        if (!incomingCall) return
        socketService.rejectCall(incomingCall.peerId)
        void logCall(incomingCall.peerId, incomingCall.callType, 'rejected')
        setIncomingCall(null)
    }

    const handleEndActive = () => {
        stopRing()
        if (activeCall) {
            const duration = callStartTimeRef.current
                ? Math.round((Date.now() - callStartTimeRef.current) / 1000)
                : undefined
            void logCall(activeCall.peerId, activeCall.callType, 'completed', duration)
        }
        callStartTimeRef.current = null
        setActiveCall(null)
    }

    const avatarSrc = incomingCall?.peerAvatar
        ? `${API_BASE}${incomingCall.peerAvatar}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall?.peerName || 'user'}`

    return (
        <>
            {/* Active call screen */}
            {activeCall && <CallScreen call={activeCall} onEnd={handleEndActive} />}

            {/* Incoming call bottom-sheet */}
            {incomingCall && !activeCall && (
                <div className="fixed inset-x-0 bottom-6 flex justify-center z-[80] px-4 animate-slide-up">
                    <div className="w-full max-w-sm bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-5">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="relative">
                                <Avatar className="h-14 w-14 border-2 border-primary/30">
                                    <AvatarImage src={avatarSrc} />
                                    <AvatarFallback className="bg-tg-gradient text-white text-xl font-bold">
                                        {(incomingCall.peerName || 'U').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base truncate">{incomingCall.peerName}</h3>
                                <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                                    {incomingCall.callType === 'video'
                                        ? <><Video className="h-3.5 w-3.5" /> Incoming video call</>
                                        : <><Phone className="h-3.5 w-3.5" /> Incoming voice call</>}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={handleReject} variant="destructive"
                                className="flex-1 rounded-2xl h-12 font-semibold gap-2">
                                <PhoneOff className="h-4 w-4" /> Decline
                            </Button>
                            <Button onClick={handleAccept}
                                className="flex-1 rounded-2xl h-12 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                                <Phone className="h-4 w-4" /> Accept
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
