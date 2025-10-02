"use client"

import { Progress } from "@/components/ui/progress"
import { CheckCircle, Upload, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number
  status: "uploading" | "processing" | "complete" | "error"
  fileName?: string
  className?: string
}

export function ProgressBar({ progress, status, fileName, className }: ProgressBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse" />
      case "processing":
        return <Upload className="h-4 w-4 animate-spin" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <Upload className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing..."
      case "complete":
        return "Upload complete!"
      case "error":
        return "Upload failed"
      default:
        return "Ready to upload"
    }
  }

  const getProgressColor = () => {
    switch (status) {
      case "complete":
        return "bg-green-500"
      case "error":
        return "bg-destructive"
      default:
        return "bg-primary"
    }
  }

  return (
    <div className={cn("space-y-3 p-4 border border-border rounded-lg", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{fileName || "Video file"}</span>
        </div>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>

      <div className="space-y-1">
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-muted-foreground">{getStatusText()}</p>
      </div>

      {status === "error" && (
        <p className="text-xs text-destructive">Upload failed. Please check your connection and try again.</p>
      )}
    </div>
  )
}
