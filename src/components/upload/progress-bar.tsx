import { Progress } from "../ui/progress"
import { CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface ProgressBarProps {
  progress: number
  status?: "uploading" | "processing" | "complete" | "error"
  message?: string
  className?: string
}

export function ProgressBar({ progress, status = "uploading", message, className }: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "complete":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "processing":
        return "text-blue-600"
      default:
        return "text-primary"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getDefaultMessage = () => {
    switch (status) {
      case "uploading":
        return "Uploading video..."
      case "processing":
        return "Processing video..."
      case "complete":
        return "Upload complete!"
      case "error":
        return "Upload failed. Please try again."
      default:
        return ""
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={cn("text-sm font-medium", getStatusColor())}>{message || getDefaultMessage()}</span>
        </div>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>

      <Progress
        value={progress}
        className={cn(
          "h-2",
          status === "error" && "bg-red-100 dark:bg-red-950",
          status === "complete" && "bg-green-100 dark:bg-green-950",
        )}
      />

      {status === "processing" && (
        <p className="text-xs text-muted-foreground">
          This may take a few minutes depending on video length and quality.
        </p>
      )}
    </div>
  )
}
