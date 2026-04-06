"use client"

import * as React from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, RotateCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { socketService } from "@/lib/socket"

const STUN_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun.stunprotocol.org:3478" },
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

// ── Audio helpers ─────────────────────────────────────────────────────────────
function playTone(freq: number, duration: number, vol = 0.3): void {
    try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + duration)
        setTimeout(() => ctx.close(), (duration + 0.1) * 1000)
    } catch (_) {}
}

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

function playConnectedChime() {
    playTone(523, 0.15, 0.25)
    setTimeout(() => playTone(659, 0.2, 0.25), 130)
}

// ── CallScreen ────────────────────────────────────────────────────────────────
interface CallScreenProps { call: CallState; onEnd: () => void }

export function CallScreen({ call, onEnd }: CallScreenProps) {
    const [muted, setMuted] = React.useState(false)
    const [videoOff, setVideoOff] = React.useState(false)
    const [speakerOff, setSpeakerOff] = React.useState(false)
    const [connected, setConnected] = React.useState(false)
    const [hasRemoteVideo, setHasRemoteVideo] = React.useState(false)
    const [status, setStatus] = React.useState(
        call.direction === 'outgoing' ? 'Calling…' : 'Connecting…'
    )
    const [duration, setDuration] = React.useState(0)
    const [showControls, setShowControls] = React.useState(true)

    const localVideoRef = React.useRef<HTMLVideoElement>(null)
    const remoteVideoRef = React.useRef<HTMLVideoElement>(null)
    const remoteAudioRef = React.useRef<HTMLAudioElement>(null)
    const pcRef = React.useRef<RTCPeerConnection | null>(null)
    const localStreamRef = React.useRef<MediaStream | null>(null)
    const remoteStreamRef = React.useRef<MediaStream>(new MediaStream())
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const stopRingbackRef = React.useRef<(() => void) | null>(null)
    const iceCandidateQueue = React.useRef<RTCIceCandidateInit[]>([])
    const controlsTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const formatDuration = (secs: number) => {
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
    }

    // Auto-hide controls after 4s during video call
    const resetControlsTimer = React.useCallback(() => {
        setShowControls(true)
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
        if (call.callType === 'video' && connected) {
            controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000)
        }
    }, [call.callType, connected])

    React.useEffect(() => {
        if (connected) {
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
            if (call.callType === 'video') {
                controlsTimerRef.current = setTimeout(() => setShowControls(false), 4000)
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
        }
    }, [connected, call.callType])

    React.useEffect(() => {
        startWebRTC()
        return () => cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        const handleUnload = () => socketService.endCall(call.peerId)
        window.addEventListener('beforeunload', handleUnload)
        return () => window.removeEventListener('beforeunload', handleUnload)
    }, [call.peerId])

    const cleanup = (sendEnd = false) => {
        stopRingbackRef.current?.()
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        pcRef.current?.close()
        if (timerRef.current) clearInterval(timerRef.current)
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
        if (sendEnd) socketService.endCall(call.peerId)
    }

    const attachRemoteStream = () => {
        const stream = remoteStreamRef.current
        // Attach to video element
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            remoteVideoRef.current.play().catch(() => {})
        }
        // Attach to audio element (always for sound)
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream
            remoteAudioRef.current.play().catch(() => {})
        }
    }

    const startWebRTC = async () => {
        try {
            if (call.direction === 'outgoing') {
                stopRingbackRef.current = startRingback()
            }

            const constraints = {
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: call.callType === 'video'
                    ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
                    : false
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            localStreamRef.current = stream

            if (localVideoRef.current && call.callType === 'video') {
                localVideoRef.current.srcObject = stream
            }

            const pc = new RTCPeerConnection(STUN_SERVERS)
            pcRef.current = pc

            stream.getTracks().forEach(track => pc.addTrack(track, stream))

            // ✅ FIX: Use addTrack pattern instead of e.streams[0]
            pc.ontrack = (e) => {
                e.streams[0]?.getTracks().forEach(track => {
                    remoteStreamRef.current.addTrack(track)
                })
                // Also add the track itself as fallback
                if (!e.streams[0]) remoteStreamRef.current.addTrack(e.track)

                attachRemoteStream()

                // Check if we got video tracks
                if (e.track.kind === 'video') setHasRemoteVideo(true)
                if (e.track.kind === 'audio' || remoteStreamRef.current.getTracks().length > 0) {
                    stopRingbackRef.current?.()
                    stopRingbackRef.current = null
                    setConnected(true)
                    setStatus('')
                    playConnectedChime()
                }
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
                if (s === 'connecting') setStatus('Connecting…')
                if (['disconnected', 'failed', 'closed'].includes(s)) handleEnd()
            }

            pc.onsignalingstatechange = async () => {
                // Drain queued ICE candidates once remote description is set
                if (pc.signalingState !== 'stable') return
                for (const c of iceCandidateQueue.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
                }
                iceCandidateQueue.current = []
            }

            if (call.direction === 'outgoing') {
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: call.callType === 'video'
                })
                await pc.setLocalDescription(offer)
                socketService.initiateCall(
                    call.peerId,
                    call.callType,
                    offer,
                    call.peerName,
                    call.peerAvatar
                )
            } else if (call.offer) {
                await pc.setRemoteDescription(call.offer)
                // Drain any queued ICE candidates
                for (const c of iceCandidateQueue.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
                }
                iceCandidateQueue.current = []
                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                socketService.sendAnswer(call.peerId, answer)
            }

            // Listen for answer (caller side)
            const handleAnswer = (data: Record<string, unknown>) => {
                if (pc.signalingState === 'have-local-offer') {
                    pc.setRemoteDescription(data.answer as RTCSessionDescriptionInit).then(() => {
                        // Drain queued ice candidates
                        iceCandidateQueue.current.forEach(c =>
                            pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}))
                        iceCandidateQueue.current = []
                    })
                }
                socketService.offCallEvent('call_answer', handleAnswer)
            }
            socketService.onCallEvent('call_answer', handleAnswer)

            // Listen for ICE candidates — queue if remote not set yet
            const handleIce = (data: Record<string, unknown>) => {
                if (!data.candidate) return
                const candidate = data.candidate as RTCIceCandidateInit
                if (pc.remoteDescription) {
                    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
                } else {
                    iceCandidateQueue.current.push(candidate)
                }
            }
            socketService.onCallEvent('call_ice_candidate', handleIce)

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'unknown'
            console.error('WebRTC error:', msg)
            setStatus(msg.includes('Permission') || msg.includes('NotAllowed')
                ? 'Camera/mic permission denied'
                : 'Connection failed')
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

    const toggleSpeaker = () => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !speakerOff
            setSpeakerOff(!speakerOff)
        }
    }

    const flipCamera = async () => {
        const track = localStreamRef.current?.getVideoTracks()[0]
        if (!track) return
        try {
            const constraints = track.getConstraints()
            const currentFacing = (constraints.facingMode as string) || 'user'
            const newFacing = currentFacing === 'user' ? 'environment' : 'user'
            await track.applyConstraints({ facingMode: newFacing })
        } catch (_) {}
    }

    const avatarSrc = call.peerAvatar
        ? `${API_BASE}${call.peerAvatar}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.peerName}`

    const isVideo = call.callType === 'video'

    return (
        <div
            className="fixed inset-0 z-[100] overflow-hidden select-none"
            onClick={resetControlsTimer}
        >
            {/* Hidden audio for remote stream */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

            {/* ── Background ─── */}
            {isVideo ? (
                <>
                    {/* Remote video — full bleed */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                            hasRemoteVideo && connected ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {/* Placeholder bg when no remote video yet */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 transition-opacity duration-500",
                        hasRemoteVideo && connected ? "opacity-0" : "opacity-100"
                    )}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                {[1,2,3].map(i => (
                                    <span key={i}
                                        className="absolute inset-0 rounded-full border border-white/10 animate-ping"
                                        style={{ animationDelay: `${i * 0.4}s`, transform: `scale(${1 + i * 0.4})` }}
                                    />
                                ))}
                                <Avatar className="h-28 w-28 border-4 border-white/20 shadow-2xl">
                                    <AvatarImage src={avatarSrc} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                                        {call.peerName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center">
                                <h2 className="text-white text-2xl font-bold">{call.peerName}</h2>
                                <p className="text-white/60 text-sm mt-1">{connected ? formatDuration(duration) : status}</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Audio call background */
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    {/* Animated background blobs */}
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
            )}

            {/* ── Dark scrim (video calls) ─── */}
            {isVideo && (
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 transition-opacity duration-300",
                    showControls ? "opacity-100" : "opacity-0"
                )} />
            )}

            {/* ── Top bar: name + status ─── */}
            <div className={cn(
                "absolute top-0 left-0 right-0 z-10 pt-12 pb-6 px-6 transition-all duration-300",
                isVideo && !showControls ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"
            )}>
                {!isVideo && (
                    /* Audio call: big centered layout */
                    <div className="flex flex-col items-center gap-6 pt-8">
                        <div className="relative flex items-center justify-center">
                            {/* Pulse rings */}
                            {!connected && [1, 2, 3].map(i => (
                                <span key={i}
                                    className="absolute rounded-full bg-white/5 border border-white/10 animate-ping"
                                    style={{
                                        width: `${120 + i * 50}px`,
                                        height: `${120 + i * 50}px`,
                                        animationDelay: `${i * 0.5}s`,
                                        animationDuration: '2s'
                                    }}
                                />
                            ))}
                            {connected && [1, 2].map(i => (
                                <span key={i}
                                    className="absolute rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ping"
                                    style={{
                                        width: `${130 + i * 40}px`,
                                        height: `${130 + i * 40}px`,
                                        animationDelay: `${i * 0.7}s`,
                                        animationDuration: '2.5s'
                                    }}
                                />
                            ))}
                            <Avatar className="h-32 w-32 border-4 border-white/20 shadow-2xl relative z-10">
                                <AvatarImage src={avatarSrc} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-5xl font-bold">
                                    {call.peerName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="text-center">
                            <h2 className="text-white text-3xl font-bold">{call.peerName}</h2>
                            <p className={cn(
                                "text-sm mt-2 font-medium",
                                connected ? "text-emerald-400" : "text-white/60"
                            )}>
                                {connected ? formatDuration(duration) : status}
                            </p>
                        </div>
                    </div>
                )}
                {isVideo && (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white/30">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                                {call.peerName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="text-white font-bold text-base leading-tight">{call.peerName}</h2>
                            <p className={cn(
                                "text-xs font-medium",
                                connected ? "text-emerald-400" : "text-white/60"
                            )}>
                                {connected ? formatDuration(duration) : status}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Local PiP (video calls) ─── */}
            {isVideo && (
                <div className={cn(
                    "absolute bottom-32 right-4 z-10 transition-all duration-300",
                    showControls ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}>
                    <div className="relative w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                                "w-full h-full object-cover",
                                videoOff ? "opacity-0" : "opacity-100"
                            )}
                        />
                        {videoOff && (
                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                <VideoOff className="h-6 w-6 text-white/40" />
                            </div>
                        )}
                        {/* flip button */}
                        <button
                            onClick={flipCamera}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center"
                        >
                            <RotateCcw className="h-3 w-3 text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Controls ─── */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 z-10 pb-10 transition-all duration-300",
                isVideo && !showControls ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}>
                <div className="flex items-center justify-center gap-5 px-8">

                    {/* Mute */}
                    <ControlButton
                        icon={muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        label={muted ? "Unmute" : "Mute"}
                        active={muted}
                        size="sm"
                        onClick={toggleMute}
                    />

                    {/* Speaker */}
                    <ControlButton
                        icon={speakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        label={speakerOff ? "Unmute spk" : "Speaker"}
                        active={speakerOff}
                        size="sm"
                        onClick={toggleSpeaker}
                    />

                    {/* End call — bigger, red */}
                    <button
                        onClick={handleEnd}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center shadow-2xl transition-all duration-150"
                    >
                        <PhoneOff className="h-7 w-7 text-white" />
                    </button>

                    {/* Video toggle (video call only) */}
                    {isVideo ? (
                        <ControlButton
                            icon={videoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                            label={videoOff ? "Start video" : "Stop video"}
                            active={videoOff}
                            size="sm"
                            onClick={toggleVideo}
                        />
                    ) : (
                        <div className="w-12 h-12" /> /* spacer */
                    )}

                    {/* Spacer to balance layout */}
                    <div className="w-12 h-12" />
                </div>

                {/* Bottom hint */}
                <p className="text-center text-white/30 text-xs mt-3">
                    {connected
                        ? isVideo ? "Tap screen to show controls" : ""
                        : "Waiting for the other person…"}
                </p>
            </div>
        </div>
    )
}

// ── Reusable control button ────────────────────────────────────────────────────
function ControlButton({
    icon, label, active, size = 'md', onClick
}: {
    icon: React.ReactNode
    label: string
    active?: boolean
    size?: 'sm' | 'md'
    onClick: () => void
}) {
    const sz = size === 'sm' ? 'w-12 h-12' : 'w-14 h-14'
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className={cn(
                    sz, "rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 shadow-lg",
                    active
                        ? "bg-white text-gray-900"
                        : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                )}
            >
                {icon}
            </button>
            <span className="text-white/50 text-[10px] font-medium">{label}</span>
        </div>
    )
}
