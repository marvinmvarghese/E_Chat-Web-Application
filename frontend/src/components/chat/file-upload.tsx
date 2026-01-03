"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Paperclip, X, FileText, Image as ImageIcon, Video, Music, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import api from "@/lib/api"

interface FileUploadProps {
    onFileSelect: (fileData: { url: string; filename: string; type: string; size: number }) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        setSelectedFile(file)
        setUploading(true)
        setProgress(0)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post('/chat/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        setProgress(percentCompleted)
                    }
                },
            })

            onFileSelect(response.data)
            setSelectedFile(null)
        } catch (error: any) {
            console.error('Upload failed:', error)
            const errorMsg = error.response?.data?.detail || error.message || 'Upload failed'
            alert(errorMsg)
            setSelectedFile(null)
        } finally {
            setUploading(false)
            setProgress(0)
        }
    }, [onFileSelect])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false,
    })

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="h-4 w-4" />
        if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return <Video className="h-4 w-4" />
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return <Music className="h-4 w-4" />
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="h-4 w-4" />
        return <FileIcon className="h-4 w-4" />
    }

    if (uploading && selectedFile) {
        return (
            <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                {getFileIcon(selectedFile.name)}
                <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{selectedFile.name}</p>
                    <Progress value={progress} className="h-1 mt-1" />
                </div>
                <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
        )
    }

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                type="button"
            >
                <Paperclip className="h-5 w-5" />
            </Button>
        </div>
    )
}
