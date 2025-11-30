"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Heart } from "lucide-react"
import { useDramaStore, useUserStore } from "@/lib/store"
import type { Comment } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CommentSectionProps {
  dramaId: string
  className?: string
}

export function CommentSection({ dramaId, className }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const { addComment, comments } = useDramaStore()
  const { user, isConnected } = useUserStore()

  const dramaComments = comments[dramaId] || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || !isConnected) return

    const comment: Comment = {
      id: `${Date.now()}-${Math.random()}`,
      userId: user.id,
      dramaId,
      content: newComment.trim(),
      timestamp: Date.now(),
      createdAt: new Date(),
      likes: 0,
    }

    addComment(dramaId, comment)
    setNewComment("")
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return `${Math.floor(minutes / 1440)}d ago`
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">Comments ({dramaComments.length})</h3>

      {/* Comment Input */}
      {user && isConnected ? (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newComment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="text-center p-4 border border-border rounded-lg">
          <p className="text-muted-foreground">Connect your wallet to join the conversation</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {dramaComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          dramaComments
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{comment.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{comment.userId.slice(0, 8)}...</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      {comment.likes}
                    </Button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
