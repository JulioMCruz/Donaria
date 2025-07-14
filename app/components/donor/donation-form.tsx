"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

type Need = {
  title: string
  description: string
  place: string
  amountNeeded: number
  amountRaised: number
  walletAddress: string
}

interface DonationFormProps {
  need: Need
}

export function DonationForm({ need }: DonationFormProps) {
  const [amount, setAmount] = useState("")
  const progress = (need.amountRaised / need.amountNeeded) * 100
  const presetAmounts = [50, 100, 250, 500]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{need.title}</CardTitle>
        <CardDescription>{need.place}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
        <div className="space-y-4">
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
        </div>
        <div className="space-y-2 text-xs">
          <p className="font-semibold">To Wallet:</p>
          <p className="text-muted-foreground break-all bg-muted p-2 rounded-md">{need.walletAddress}</p>
        </div>
        <Button size="lg" className="w-full bg-teal-500 hover:bg-teal-600 text-white">
          Donate {amount ? `${amount} XLM` : ""} with Stellar
        </Button>
      </CardContent>
    </Card>
  )
}
