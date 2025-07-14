"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function CommentForm() {
  return (
    <form className="space-y-4 border-t pt-6 mt-6">
      <h3 className="font-semibold">Leave a message of support</h3>
      <Textarea placeholder="Write your comment here..." rows={3} />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox id="anonymous" />
          <Label htmlFor="anonymous" className="text-sm font-normal">
            Post anonymously
          </Label>
        </div>
        <Button>Post Comment</Button>
      </div>
    </form>
  )
}
