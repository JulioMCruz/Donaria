import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShieldCheck } from "lucide-react"

interface BeneficiaryInfoProps {
  author: string
  avatarUrl: string | null
  reputationScore: number
}

export function BeneficiaryInfo({ author, avatarUrl, reputationScore }: BeneficiaryInfoProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Avatar>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback>{author.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-semibold">{author}</p>
        <p className="text-xs text-muted-foreground">Beneficiary</p>
      </div>
      <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
        <ShieldCheck className="h-5 w-5" />
        <span className="font-bold text-sm">{reputationScore}% Trust Score</span>
      </div>
    </div>
  )
}
