"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { BeneficiaryInfo } from "./beneficiary-info"
import { ReputationVote } from "./reputation-vote"
import { Loader2, CheckCircle } from "lucide-react"

type Need = {
  title: string
  description: string
  place: string
  amountNeeded: number
  amountRaised: number
  walletAddress: string
  author: string
  authorAvatarUrl: string | null
  reputationScore: number
}

interface DonationInteractionCardProps {
  need: Need
}

export function DonationInteractionCard({ need }: DonationInteractionCardProps) {
  const [amount, setAmount] = useState("")
  const [donationState, setDonationState] = useState<"idle" | "processing" | "success" | "voted">("idle")
  const progress = (need.amountRaised / need.amountNeeded) * 100
  const presetAmounts = [50, 100, 250, 500]

  const handleDonate = () => {
    setDonationState("processing")
    // Simulate network request
    setTimeout(() => {
      setDonationState("success")
    }, 2000)
  }

  const handleVote = (vote: "up" | "down") => {
    // Here you would send the vote to your backend
    console.log(`Voted: ${vote}`)
    setDonationState("voted")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{need.title}</CardTitle>
        <CardDescription>{need.place}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BeneficiaryInfo author={need.author} avatarUrl={need.authorAvatarUrl} reputationScore={need.reputationScore} />
        <p className="text-muted-foreground text-sm">{need.description}</p>
        <div>
          <div className="mb-2">
            <Progress value={progress} />
          </div>
          <div className="flex justify-between text-base">
            <span className="font-bold text-teal-600 dark:text-teal-400">${need.amountRaised.toLocaleString()}</span>
            <span className="text-muted-foreground">raised of ${need.amountNeeded.toLocaleString()}</span>
          </div>
        </div>

        {donationState === "idle" && (
          <div className="space-y-4 border-t pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetAmounts.map((preset) => (
                <Button key={preset} variant="outline" onClick={() => setAmount(String(preset))}>
                  {preset} XLM
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Or enter a custom amount (XLM)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 75"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-semibold">To Wallet:</p>
              <p className="text-muted-foreground break-all bg-muted p-2 rounded-md">{need.walletAddress}</p>
            </div>
            <Button size="lg" className="w-full bg-teal-500 hover:bg-teal-600 text-white" onClick={handleDonate}>
              Donate {amount ? `${amount} XLM` : ""} with Stellar
            </Button>
          </div>
        )}

        {donationState === "processing" && (
          <div className="flex items-center justify-center flex-col text-center space-y-2 h-48">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="font-semibold">Processing Donation...</p>
            <p className="text-sm text-muted-foreground">Please wait while we confirm on the network.</p>
          </div>
        )}

        {donationState === "success" && <ReputationVote onVote={handleVote} />}

        {donationState === "voted" && (
          <div className="flex items-center justify-center flex-col text-center space-y-2 h-48">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="font-semibold">Thank you for your feedback!</p>
            <p className="text-sm text-muted-foreground">Your input helps build a more trustworthy community.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
