"use client"

import { useChatStore } from "@/lib/store"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConnectionStatus({ className }: { className?: string }) {
    const { connectionStatus } = useChatStore()

    if (connectionStatus === 'connected') {
        return null // Don't show anything when connected
    }

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow-sm",
            connectionStatus === 'disconnected' && "bg-red-50 text-red-700 border border-red-200",
            connectionStatus === 'reconnecting' && "bg-yellow-50 text-yellow-700 border border-yellow-200",
            className
        )}>
            {connectionStatus === 'disconnected' && (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span>Disconnected</span>
                </>
            )}
            {connectionStatus === 'reconnecting' && (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Reconnecting...</span>
                </>
            )}
        </div>
    )
}
