"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, Flag } from "lucide-react"

interface ReputationVoteProps {
  onVote: (vote: "up" | "down") => void
}

export function ReputationVote({ onVote }: ReputationVoteProps) {
  return (
    <div className="text-center space-y-4 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
      <h3 className="font-semibold">Thank you! Help verify this need.</h3>
      <p className="text-sm text-muted-foreground">Does this report seem legitimate and trustworthy to you?</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => onVote("up")}>
          <ThumbsUp className="mr-2 h-4 w-4" />
          Looks Trustworthy
        </Button>
        <Button variant="destructive" onClick={() => onVote("down")}>
          <Flag className="mr-2 h-4 w-4" />
          Report a Concern
        </Button>
      </div>
    </div>
  )
}
