"use client"

import type React from "react"
import { useState } from "react"
import { Send, Heart, Reply } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "../../lib/utils"

interface Comment {
  id: string
  user: {
    name: string
    avatar?: string
  }
  content: string
  timestamp: number
  likes: number
  replies?: Comment[]
}

interface CommentSectionProps {
  dramaId: string
  comments?: Comment[]
  onAddComment?: (content: string) => void
  className?: string
}

const mockComments: Comment[] = [
  {
    id: "1",
    user: { name: "Sarah Chen", avatar: "/avatars/sarah.jpg" },
    content: "OMG this plot twist! I did NOT see that coming! 😱",
    timestamp: Date.now() - 300000,
    likes: 24,
    replies: [
      {
        id: "1-1",
        user: { name: "Mike Johnson" },
        content: "Right?! My jaw literally dropped",
        timestamp: Date.now() - 240000,
        likes: 8,
      },
    ],
  },
  {
    id: "2",
    user: { name: "Emma Rodriguez" },
    content: "The acting in this scene is incredible. So much emotion! 💔",
    timestamp: Date.now() - 600000,
    likes: 45,
  },
  {
    id: "3",
    user: { name: "David Kim" },
    content: "Anyone else binge-watching this entire series tonight? 🍿",
    timestamp: Date.now() - 900000,
    likes: 12,
  },
]

export function CommentSection({ dramaId, comments = mockComments, onAddComment, className }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    onAddComment?.(newComment)
    setNewComment("")
    setReplyingTo(null)
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={cn("space-y-2", isReply && "ml-8 border-l-2 border-muted pl-4")}>
      <div className="flex items-start space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
          <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.timestamp)}</span>
          </div>

          <p className="text-sm text-foreground">{comment.content}</p>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-red-500">
              <Heart className="w-3 h-3 mr-1" />
              {comment.likes}
            </Button>

            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(comment.id)}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <form onSubmit={handleSubmit} className="ml-11 flex space-x-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Reply to ${comment.user.name}...`}
            className="flex-1 h-8 text-sm"
          />
          <Button type="submit" size="sm" className="h-8">
            <Send className="w-3 h-3" />
          </Button>
        </form>
      )}
    </div>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Avatar className="w-8 h-8">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex space-x-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <ScrollArea className="h-96">
        <div className="space-y-4 pr-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
