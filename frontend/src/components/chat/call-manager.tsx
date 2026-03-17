"use client"

import * as React from "react"
import { Phone, PhoneOff, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { socketService } from "@/lib/socket"
import { CallScreen, CallState } from "@/components/chat/call-screen"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ── Synthetic ringtone using Web Audio API ─────────────────────────────────
function createRingtone(ctx: AudioContext, type: 'incoming' | 'outgoing') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'incoming') {
        // WhatsApp-style: two-tone rising beep
        osc.type = 'sine'
        osc.frequency.setValueAtTime(480, ctx.currentTime)
        osc.frequency.setValueAtTime(620, ctx.currentTime + 0.25)
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
    } else {
        // Outgoing: steady single tone
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.8)
    }
}

// Auto-loops a ringtone until stopped
function startRinging(type: 'incoming' | 'outgoing'): () => void {
    let ctx: AudioContext | null = null
    let stopped = false
    let t: ReturnType<typeof setInterval> | null = null

    const ring = () => {
        if (stopped) return
        try {
            ctx = new AudioContext()
            createRingtone(ctx, type)
        } catch (_) {}
    }

    ring()
    t = setInterval(ring, type === 'incoming' ? 1200 : 3000)

    return () => {
        stopped = true
        if (t) clearInterval(t)
        ctx?.close()
    }
}

// ── CallManager ────────────────────────────────────────────────────────────

export function CallManager() {
    const [incomingCall, setIncomingCall] = React.useState<CallState | null>(null)
    const [activeCall, setActiveCall] = React.useState<CallState | null>(null)
    const stopRingRef = React.useRef<(() => void) | null>(null)

    // Start/stop ringtone when incoming call arrives or goes away
    React.useEffect(() => {
        if (incomingCall && !activeCall) {
            stopRingRef.current = startRinging('incoming')
        }
        return () => {
            stopRingRef.current?.()
            stopRingRef.current = null
        }
    }, [incomingCall, activeCall])

    React.useEffect(() => {
        const handleCallOffer = (data: Record<string, unknown>) => {
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

        const handleCallEnd = () => {
            stopRingRef.current?.()
            setActiveCall(null)
            setIncomingCall(null)
        }

        const handleCallReject = () => {
            stopRingRef.current?.()
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
    }, [activeCall])

    const handleAccept = () => {
        stopRingRef.current?.()
        stopRingRef.current = null
        if (!incomingCall) return
        setActiveCall(incomingCall)
        setIncomingCall(null)
    }

    const handleReject = () => {
        stopRingRef.current?.()
        stopRingRef.current = null
        if (!incomingCall) return
        socketService.rejectCall(incomingCall.peerId)
        setIncomingCall(null)
    }

    const handleEndActive = () => {
        stopRingRef.current?.()
        stopRingRef.current = null
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
                <div className="fixed inset-x-0 bottom-6 flex justify-center z-[80] px-4">
                    <div className="w-full max-w-sm bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-5 animate-scale-in">
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
                                <p className="text-sm text-primary flex items-center gap-1.5">
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
