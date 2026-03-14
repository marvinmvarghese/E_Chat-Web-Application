"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
    className?: string
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("animate-pulse rounded-md bg-secondary/50", className)} />
    )
}

export function MessageSkeleton({ isMe = false }: { isMe?: boolean }) {
    return (
        <div className={cn("flex gap-3 w-full", isMe ? "justify-end" : "justify-start")}>
            {!isMe && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
            <div className="flex flex-col gap-2 max-w-[65%]">
                <Skeleton className={cn("h-16 rounded-2xl", isMe ? "w-48" : "w-56")} />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    )
}

export function ChatListSkeleton() {
    return (
        <div className="space-y-1 px-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            ))}
        </div>
    )
}
