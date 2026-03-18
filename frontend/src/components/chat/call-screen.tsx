"use client"

import * as React from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { socketService } from "@/lib/socket"

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type CallState = {
    peerId: number
    peerName: string
    peerAvatar?: string
    callType: 'audio' | 'video'
    direction: 'outgoing' | 'incoming'
    offer?: RTCSessionDescriptionInit
}

// ── Tone helpers ─────────────────────────────────────────────────────────────

function playTone(freq: number, duration: number, vol = 0.3): void {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + duration)
        setTimeout(() => ctx.close(), (duration + 0.1) * 1000)
    } catch (_) {}
}

// Ring-back tone (outgoing: "brr-ing, brr-ing" style)
function startRingback(): () => void {
    let stopped = false
    const ring = () => {
        if (stopped) return
        playTone(440, 0.4, 0.2)
        setTimeout(() => { if (!stopped) playTone(480, 0.4, 0.2) }, 200)
    }
    ring()
    const t = setInterval(ring, 3000)
    return () => { stopped = true; clearInterval(t) }
}

// Connected sound: rising two-note chime
function playConnectedChime() {
    playTone(523, 0.15, 0.25)
    setTimeout(() => playTone(659, 0.2, 0.25), 130)
}

// ── CallScreen component ─────────────────────────────────────────────────────

interface CallScreenProps {
    call: CallState
    onEnd: () => void
}

export function CallScreen({ call, onEnd }: CallScreenProps) {
    const [muted, setMuted] = React.useState(false)
    const [videoOff, setVideoOff] = React.useState(false)
    const [connected, setConnected] = React.useState(false)
    const [status, setStatus] = React.useState(
        call.direction === 'outgoing' ? 'Calling…' : 'Connecting…'
    )
    const [duration, setDuration] = React.useState(0)
    const localVideoRef = React.useRef<HTMLVideoElement>(null)
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
    const remoteAudioRef = React.useRef<HTMLAudioElement>(null)
    const pcRef = React.useRef<RTCPeerConnection | null>(null)
    const localStreamRef = React.useRef<MediaStream | null>(null)
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const stopRingbackRef = React.useRef<(() => void) | null>(null)

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

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

    const cleanup = (sendEnd = false) => {
        stopRingbackRef.current?.()
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        pcRef.current?.close()
        if (timerRef.current) clearInterval(timerRef.current)
        if (sendEnd) socketService.endCall(call.peerId)
    }

    // Ensure peer is notified if tab closes during a call
    React.useEffect(() => {
        const handleUnload = () => socketService.endCall(call.peerId)
        window.addEventListener('beforeunload', handleUnload)
        return () => window.removeEventListener('beforeunload', handleUnload)
    }, [call.peerId])

    const startWebRTC = async () => {
        try {
            // Start ringback tone for outgoing calls
            if (call.direction === 'outgoing') {
                stopRingbackRef.current = startRingback()
            }

            // Request media
            const constraints = {
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
                video: call.callType === 'video'
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStreamRef.current = stream

            if (localVideoRef.current && call.callType === 'video') {
                localVideoRef.current.srcObject = stream
            }

            const pc = new RTCPeerConnection(STUN_SERVERS)
            pcRef.current = pc

            stream.getTracks().forEach(track => pc.addTrack(track, stream))

            // When we get the remote stream — attach to <audio> and <video>
            pc.ontrack = (e) => {
                const remoteStream = e.streams[0]
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStream
                    remoteAudioRef.current.play().catch(() => {})
                }
                stopRingbackRef.current?.()
                stopRingbackRef.current = null
                setConnected(true)
                setStatus('')
                playConnectedChime()
            }

            pc.onicecandidate = (e) => {
                if (e.candidate) socketService.sendIceCandidate(call.peerId, e.candidate.toJSON())
            }

            pc.onconnectionstatechange = () => {
                const s = pc.connectionState
                if (s === 'connected') {
                    stopRingbackRef.current?.()
                    setConnected(true)
                    setStatus('')
                }
                if (['disconnected', 'failed', 'closed'].includes(s)) handleEnd()
            }

            if (call.direction === 'outgoing') {
                // Create offer
                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: call.callType === 'video' })
                await pc.setLocalDescription(offer)
                socketService.initiateCall(call.peerId, call.callType, offer)
            } else if (call.offer) {
                // We're the callee
                await pc.setRemoteDescription(call.offer)
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                socketService.sendAnswer(call.peerId, answer)
            }

            // Listen for answer (caller side)
            const handleAnswer = (data: Record<string, unknown>) => {
                if (pc.signalingState === 'have-local-offer') {
                    pc.setRemoteDescription(data.answer as RTCSessionDescriptionInit)
                }
                socketService.offCallEvent('call_answer', handleAnswer)
            }
            socketService.onCallEvent('call_answer', handleAnswer)

            // Listen for ICE candidates
            const handleIce = (data: Record<string, unknown>) => {
                if (data.candidate) {
                    pc.addIceCandidate(new RTCIceCandidate(data.candidate as RTCIceCandidateInit)).catch(() => {})
                }
            }
            socketService.onCallEvent('call_ice_candidate', handleIce)

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'unknown'
            console.error('WebRTC error:', msg)
            setStatus(`Error: ${msg.includes('Permission') ? 'Mic/camera permission denied' : 'Connection failed'}`)
            setTimeout(handleEnd, 3000)
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
            {/* Hidden audio element for remote stream */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* Remote video (full bg for video calls) */}
            {call.callType === 'video' ? (
                <video ref={remoteVideoRef} autoPlay playsInline
                    className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            )}

            {/* Overlay tint */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Top info */}
            <div className="relative z-10 flex flex-col items-center pt-16 gap-4">
                <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback className="bg-tg-gradient text-white text-3xl font-bold">
                            {call.peerName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {!connected && (
                        <span className="absolute -inset-2 rounded-full border-2 border-white/20 animate-ping pointer-events-none" />
                    )}
                </div>
                <div className="text-center">
                    <h2 className="text-white text-2xl font-bold">{call.peerName}</h2>
                    <p className="text-white/70 text-sm mt-1">
                        {connected ? formatDuration(duration) : status}
                    </p>
                </div>
            </div>

            {/* Local pip for video */}
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
