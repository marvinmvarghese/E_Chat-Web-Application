"use client"

import * as React from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { socketService } from "@/lib/socket"

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ]
}

export type CallState = {
    peerId: number
    peerName: string
    peerAvatar?: string
    callType: 'audio' | 'video'
    direction: 'outgoing' | 'incoming'
    offer?: RTCSessionDescriptionInit
}

interface CallScreenProps {
    call: CallState
    onEnd: () => void
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export function CallScreen({ call, onEnd }: CallScreenProps) {
    const [muted, setMuted] = React.useState(false)
    const [videoOff, setVideoOff] = React.useState(false)
    const [connected, setConnected] = React.useState(false)
    const [duration, setDuration] = React.useState(0)
    const localVideoRef = React.useRef<HTMLVideoElement>(null)
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
    const pcRef = React.useRef<RTCPeerConnection | null>(null)
    const localStreamRef = React.useRef<MediaStream | null>(null)
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

    // Format duration as mm:ss
    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    // Start call timer when connected
    React.useEffect(() => {
        if (connected) {
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [connected])

    React.useEffect(() => {
        startWebRTC()
        return () => cleanup()
    }, [])

    const cleanup = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        pcRef.current?.close()
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const startWebRTC = async () => {
        try {
            const constraints = { audio: true, video: call.callType === 'video' }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStreamRef.current = stream
            if (localVideoRef.current) localVideoRef.current.srcObject = stream

            const pc = new RTCPeerConnection(STUN_SERVERS)
            pcRef.current = pc

            stream.getTracks().forEach(track => pc.addTrack(track, stream))

            pc.ontrack = (e) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
                setConnected(true)
            }

            pc.onicecandidate = (e) => {
                if (e.candidate) socketService.sendIceCandidate(call.peerId, e.candidate.toJSON())
            }

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') setConnected(true)
                if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) handleEnd()
            }

            if (call.direction === 'outgoing') {
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                socketService.initiateCall(call.peerId, call.callType, offer, undefined, undefined)
            } else if (call.offer) {
                await pc.setRemoteDescription(call.offer)
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                socketService.sendAnswer(call.peerId, answer)
            }

            // Listen for answer (if caller)
            const handleAnswer = (data: Record<string, unknown>) => {
                pc.setRemoteDescription(data.answer as RTCSessionDescriptionInit)
                socketService.offCallEvent('call_answer', handleAnswer)
            }
            socketService.onCallEvent('call_answer', handleAnswer)

            // Listen for ICE
            const handleIce = (data: Record<string, unknown>) => {
                pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit))
            }
            socketService.onCallEvent('call_ice_candidate', handleIce)

        } catch (err) {
            console.error('WebRTC error:', err)
            handleEnd()
        }
    }

    const handleEnd = () => {
        socketService.endCall(call.peerId)
        cleanup()
        onEnd()
    }

    const toggleMute = () => {
        const track = localStreamRef.current?.getAudioTracks()[0]
        if (track) { track.enabled = muted; setMuted(!muted) }
    }

    const toggleVideo = () => {
        const track = localStreamRef.current?.getVideoTracks()[0]
        if (track) { track.enabled = videoOff; setVideoOff(!videoOff) }
    }

    const avatarSrc = call.peerAvatar
        ? `${API_BASE}${call.peerAvatar}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.peerName}`

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
            {/* Remote video (full bg) */}
            {call.callType === 'video' ? (
                <video ref={remoteVideoRef} autoPlay playsInline
                    className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            {/* Top info */}
            <div className="relative z-10 flex flex-col items-center pt-16 gap-4">
                <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="bg-tg-gradient text-white text-3xl font-bold">
                        {call.peerName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center">
                    <h2 className="text-white text-2xl font-bold">{call.peerName}</h2>
                    <p className="text-white/70 text-sm mt-1">
                        {connected ? formatDuration(duration) : call.direction === 'outgoing' ? 'Calling…' : 'Connecting…'}
                    </p>
                </div>
            </div>

            {/* Local video pip */}
            {call.callType === 'video' && (
                <video ref={localVideoRef} autoPlay playsInline muted
                    className="absolute bottom-28 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-white/20 shadow-xl z-10" />
            )}

            {/* Controls */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-10">
                <button onClick={toggleMute}
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
                        muted ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30")}>
                    {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>

                {call.callType === 'video' && (
                    <button onClick={toggleVideo}
                        className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg",
                            videoOff ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30")}>
                        {videoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </button>
                )}

                <button onClick={handleEnd}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all hover:scale-105">
                    <PhoneOff className="h-7 w-7 text-white" />
                </button>
            </div>
        </div>
    )
}

// ── Outgoing call overlay (before connected) ──────────────────────────────────

interface OutgoingCallOverlayProps {
    call: CallState
    onCancel: () => void
}

export function OutgoingCallOverlay({ call, onCancel }: OutgoingCallOverlayProps) {
    const avatarSrc = call.peerAvatar
        ? `${API_BASE}${call.peerAvatar}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.peerName}`

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6 p-8">
                <div className="relative">
                    <Avatar className="h-28 w-28 border-4 border-primary/40 shadow-2xl">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="bg-tg-gradient text-white text-4xl font-bold">
                            {call.peerName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                </div>
                <div className="text-center">
                    <h2 className="text-white text-2xl font-bold">{call.peerName}</h2>
                    <p className="text-white/60 text-sm mt-1">{call.callType === 'video' ? 'Video call' : 'Voice call'}…</p>
                </div>
                <Button onClick={onCancel}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-xl hover:scale-105 transition-all">
                    <PhoneOff className="h-7 w-7" />
                </Button>
                <p className="text-white/40 text-xs">Tap to cancel</p>
            </div>
        </div>
    )
}
