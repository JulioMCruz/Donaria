import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Comment = {
  id: string
  author: string
  date: string
  text: string
  avatarUrl: string | null
}

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={comment.avatarUrl || undefined} />
            <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{comment.author}</p>
              <p className="text-xs text-muted-foreground">{new Date(comment.date).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
