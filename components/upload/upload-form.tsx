"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileVideo, AlertCircle } from "lucide-react"
import { useUserStore } from "@/lib/store"
import type { EmotionalTag } from "@/lib/types"
import { cn } from "@/lib/utils"

interface UploadFormProps {
  onSubmit?: (data: UploadData) => void
  isUploading?: boolean
  className?: string
}

interface UploadData {
  title: string
  description: string
  file: File | null
  thumbnail: File | null
  tags: EmotionalTag[]
  emotionalMarkers: Array<{
    timestamp: number
    emotion: EmotionalTag
    description: string
  }>
}

const emotionalTags: { value: EmotionalTag; label: string; color: string }[] = [
  { value: "shocked", label: "Shocked", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "sad", label: "Sad", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "happy", label: "Happy", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "angry", label: "Angry", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "romantic", label: "Romantic", color: "bg-pink-100 text-pink-800 border-pink-200" },
  { value: "suspense", label: "Suspense", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "comedy", label: "Comedy", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "heartbreak", label: "Heartbreak", color: "bg-red-200 text-red-900 border-red-300" },
]

export function UploadForm({ onSubmit, isUploading = false, className }: UploadFormProps) {
  const { user, isConnected } = useUserStore()
  const [formData, setFormData] = useState<UploadData>({
    title: "",
    description: "",
    file: null,
    thumbnail: null,
    tags: [],
    emotionalMarkers: [],
  })
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const videoFile = files.find((file) => file.type.startsWith("video/"))
      const imageFile = files.find((file) => file.type.startsWith("image/"))

      if (videoFile) {
        handleVideoFile(videoFile)
      }
      if (imageFile && !formData.thumbnail) {
        handleThumbnailFile(imageFile)
      }
    },
    [formData.thumbnail],
  )

  const handleVideoFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrors({ ...errors, file: "Please select a valid video file" })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      setErrors({ ...errors, file: "File size must be less than 100MB" })
      return
    }

    setFormData({ ...formData, file })
    setErrors({ ...errors, file: "" })

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleThumbnailFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrors({ ...errors, thumbnail: "Please select a valid image file" })
      return
    }

    setFormData({ ...formData, thumbnail: file })
    setErrors({ ...errors, thumbnail: "" })

    // Create preview URL
    const url = URL.createObjectURL(file)
    setThumbnailPreview(url)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleVideoFile(file)
    }
  }

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleThumbnailFile(file)
    }
  }

  const toggleTag = (tag: EmotionalTag) => {
    const newTags = formData.tags.includes(tag) ? formData.tags.filter((t) => t !== tag) : [...formData.tags, tag]
    setFormData({ ...formData, tags: newTags })
  }

  const addEmotionalMarker = () => {
    const newMarker = {
      timestamp: 0,
      emotion: "happy" as EmotionalTag,
      description: "",
    }
    setFormData({
      ...formData,
      emotionalMarkers: [...formData.emotionalMarkers, newMarker],
    })
  }

  const updateEmotionalMarker = (index: number, field: string, value: any) => {
    const newMarkers = [...formData.emotionalMarkers]
    newMarkers[index] = { ...newMarkers[index], [field]: value }
    setFormData({ ...formData, emotionalMarkers: newMarkers })
  }

  const removeEmotionalMarker = (index: number) => {
    const newMarkers = formData.emotionalMarkers.filter((_, i) => i !== index)
    setFormData({ ...formData, emotionalMarkers: newMarkers })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!formData.file) {
      newErrors.file = "Video file is required"
    }
    if (formData.tags.length === 0) {
      newErrors.tags = "Please select at least one emotional tag"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !user) {
      setErrors({ general: "Please connect your wallet to upload content" })
      return
    }

    if (!validateForm()) {
      return
    }

    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    onSubmit?.(formData)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      file: null,
      thumbnail: null,
      tags: [],
      emotionalMarkers: [],
    })
    setPreviewUrl(null)
    setThumbnailPreview(null)
    setUploadProgress(0)
    setErrors({})
  }

  if (!isConnected || !user) {
    return (
      <Card className={cn("max-w-2xl mx-auto", className)}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Connection Required</h3>
          <p className="text-muted-foreground mb-4">
            You need to connect your wallet to upload and manage drama content.
          </p>
          <p className="text-sm text-muted-foreground">
            Connect your wallet using the button in the navigation bar to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6 max-w-4xl mx-auto", className)}>
      {errors.general && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {errors.general}
        </div>
      )}

      {/* Video Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-border",
              errors.file ? "border-destructive" : "",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {formData.file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <FileVideo className="h-8 w-8 text-primary" />
                  <span className="font-medium">{formData.file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, file: null })
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {previewUrl && (
                  <video
                    src={previewUrl}
                    className="max-w-xs mx-auto rounded-lg"
                    controls
                    style={{ maxHeight: "200px" }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium">Drop your video here</p>
                  <p className="text-muted-foreground">or click to browse files</p>
                </div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
              </div>
            )}
          </div>
          {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
        </CardContent>
      </Card>

      {/* Thumbnail Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Thumbnail (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            {formData.thumbnail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-medium">{formData.thumbnail.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, thumbnail: null })
                      setThumbnailPreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview || "/placeholder.svg"}
                    alt="Thumbnail preview"
                    className="max-w-xs mx-auto rounded-lg"
                    style={{ maxHeight: "150px" }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">Upload a custom thumbnail</p>
                <p className="text-sm text-muted-foreground">Recommended: 16:9 aspect ratio</p>
                <Button type="button" variant="outline" size="sm" onClick={() => thumbnailInputRef.current?.click()}>
                  Choose Image
                </Button>
              </div>
            )}
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Drama Details */}
      <Card>
        <CardHeader>
          <CardTitle>Drama Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter drama title..."
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your drama..."
              rows={4}
              className={errors.description ? "border-destructive" : ""}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label>Emotional Tags *</Label>
            <div className="flex flex-wrap gap-2">
              {emotionalTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={formData.tags.includes(tag.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    formData.tags.includes(tag.value) ? "bg-primary text-primary-foreground" : tag.color,
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
            {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Emotional Markers */}
      <Card>
        <CardHeader>
          <CardTitle>Emotional Markers (Optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add specific moments in your video that trigger strong emotions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.emotionalMarkers.map((marker, index) => (
            <div key={index} className="flex space-x-4 items-end p-4 border border-border rounded-lg">
              <div className="flex-1 space-y-2">
                <Label>Timestamp (seconds)</Label>
                <Input
                  type="number"
                  value={marker.timestamp}
                  onChange={(e) => updateEmotionalMarker(index, "timestamp", Number.parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Emotion</Label>
                <select
                  value={marker.emotion}
                  onChange={(e) => updateEmotionalMarker(index, "emotion", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  {emotionalTags.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Description</Label>
                <Input
                  value={marker.description}
                  onChange={(e) => updateEmotionalMarker(index, "description", e.target.value)}
                  placeholder="Describe the moment..."
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEmotionalMarker(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addEmotionalMarker}>
            Add Emotional Marker
          </Button>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex space-x-4">
        <Button type="submit" disabled={isUploading} className="flex-1">
          {isUploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Drama
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={resetForm} disabled={isUploading}>
          Reset
        </Button>
      </div>
    </form>
  )
}
