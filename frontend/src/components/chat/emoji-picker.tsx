"use client"

import { useState } from "react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface EmojiPickerComponentProps {
    onEmojiSelect: (emoji: string) => void
}

export function EmojiPickerComponent({ onEmojiSelect }: EmojiPickerComponentProps) {
    const [open, setOpen] = useState(false)

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiSelect(emojiData.emoji)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    type="button"
                >
                    <Smile className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-full p-0 border-0"
                side="top"
                align="end"
            >
                <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={350}
                    height={400}
                    searchPlaceHolder="Search emoji..."
                    previewConfig={{ showPreview: false }}
                />
            </PopoverContent>
        </Popover>
    )
}
