"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { UploadForm } from "../components/upload/upload-form"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Upload, CheckCircle, Clock, Users } from "lucide-react"
import { useWallet } from "../components/wallet/wallet-provider"

export function UploadPage() {
  const navigate = useNavigate()
  const { isConnected } = useWallet()
  const [uploadStats] = useState({
    totalUploads: 42,
    totalViews: 125000,
    totalReactions: 8500,
  })

  const handleUploadSuccess = (dramaId: string) => {
    // Navigate to the uploaded drama
    navigate(`/watch?id=${dramaId}`)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Upload Your Drama</h1>
            <p className="text-muted-foreground">Share your emotional short dramas with the ReelShort community</p>
          </div>

          <Card className="p-8">
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
              <p className="text-muted-foreground">You need to connect your wallet to upload and manage your dramas.</p>
              <Button
                onClick={() => {
                  /* Wallet connection handled by WalletConnect component */
                }}
              >
                Connect Wallet to Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Upload Your Drama</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Share your emotional short dramas with the ReelShort community. Add emotional markers to help viewers
            connect with key moments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploadStats.totalUploads}</div>
              <p className="text-xs text-muted-foreground">Your dramas on ReelShort</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploadStats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all your content</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uploadStats.totalReactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Emotional engagements</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upload Guidelines
            </CardTitle>
            <CardDescription>Follow these guidelines to ensure your drama gets maximum engagement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Technical Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vertical video format (9:16 aspect ratio)</li>
                  <li>• Maximum duration: 10 minutes</li>
                  <li>• Minimum resolution: 720p</li>
                  <li>• Supported formats: MP4, MOV, AVI</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Content Guidelines</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Add emotional tags for better discovery</li>
                  <li>• Include compelling thumbnail</li>
                  <li>• Write engaging description</li>
                  <li>• Mark emotional scenes with timestamps</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Badge variant="secondary">Drama</Badge>
              <Badge variant="secondary">Romance</Badge>
              <Badge variant="secondary">Suspense</Badge>
              <Badge variant="secondary">Comedy</Badge>
              <Badge variant="secondary">Emotional</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <UploadForm onSuccess={handleUploadSuccess} />
      </div>
    </div>
  )
}
