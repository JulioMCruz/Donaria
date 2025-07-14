"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { BeneficiaryInfo } from "./beneficiary-info"
import { ReputationVote } from "./reputation-vote"
import { Loader2, CheckCircle, ExternalLink } from "lucide-react"
import { PinProtectedAction } from "@/components/pin-protected-action"
import { useWallet } from "@/contexts/WalletContext"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

type Need = {
  id: string
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
  onDonationComplete?: () => void
}

interface DonationResult {
  success: boolean
  transactionHash?: string
  amount: number
  message: string
}

export function DonationInteractionCard({ need, onDonationComplete }: DonationInteractionCardProps) {
  const { wallet } = useWallet()
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [donationState, setDonationState] = useState<"idle" | "processing" | "success" | "voted">("idle")
  const [donationResult, setDonationResult] = useState<DonationResult | null>(null)
  const [userDonationStatus, setUserDonationStatus] = useState<{
    hasDonated: boolean
    hasVoted: boolean
  }>({ hasDonated: false, hasVoted: false })
  
  const progress = (need.amountRaised / need.amountNeeded) * 100
  const presetAmounts = [50, 100, 250, 500]

  // Check user's donation and voting status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user || !wallet?.publicKey) return
      
      try {
        // Check if user has donated to this need
        const donationResponse = await fetch(`/api/donations/check?needId=${need.id}&userWallet=${wallet.publicKey}`)
        const donationData = await donationResponse.json()
        
        // Check if user has voted on this need
        const voteResponse = await fetch(`/api/votes/check?needId=${need.id}&userWallet=${wallet.publicKey}`)
        const voteData = await voteResponse.json()
        
        setUserDonationStatus({
          hasDonated: donationData.hasDonated || false,
          hasVoted: voteData.hasVoted || false
        })
        
        // Always start in idle state to allow multiple donations
        // Only show voting state if user just completed a donation (handled by processDonation)
        // This allows users to donate multiple times to the same need
      } catch (error) {
        console.error('Error checking user status:', error)
      }
    }
    
    checkUserStatus()
  }, [user, wallet?.publicKey, need.id])

  const processDonation = async (privateKey: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid donation amount")
      return
    }
    
    if (!user || !wallet?.publicKey) {
      toast.error("Please log in to donate")
      return
    }
    
    try {
      setDonationState("processing")
      console.log('🎯 Processing donation...', {
        amount: parseFloat(amount),
        from: wallet.publicKey.substring(0, 10) + '...',
        to: need.walletAddress.substring(0, 10) + '...',
        needId: need.id
      })
      
      toast.info("Processing donation... This may take a moment.")
      
      const response = await fetch('/api/donations/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          needId: need.id,
          amount: parseFloat(amount),
          fromWallet: wallet.publicKey,
          toWallet: need.walletAddress,
          donorPrivateKey: privateKey,
          donorFirebaseUid: user.uid
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Donation successful!')
        setDonationResult({
          success: true,
          transactionHash: result.transactionHash,
          amount: parseFloat(amount),
          message: result.message
        })
        setDonationState("success")
        setUserDonationStatus(prev => ({ ...prev, hasDonated: true }))
        toast.success(`Donation of ${amount} XLM successful!`)
        
        // Call callback to refresh need data
        if (onDonationComplete) {
          onDonationComplete()
        }
      } else {
        console.error('❌ Donation failed:', result.error)
        setDonationState("idle")
        toast.error(result.error || "Donation failed")
      }
    } catch (error: any) {
      console.error('❌ Error processing donation:', error)
      setDonationState("idle")
      toast.error(error.message || "Failed to process donation")
    }
  }

  const handleProtectedDonation = async (privateKey: string, publicKey: string) => {
    console.log('🔐 Executing protected donation...')
    await processDonation(privateKey)
  }

  const handleVote = async (vote: "up" | "down") => {
    if (!user || !wallet?.publicKey) {
      toast.error("Please log in to vote")
      return
    }
    
    try {
      console.log('🗳️ Submitting vote:', vote)
      
      const response = await fetch('/api/votes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          needId: need.id,
          vote,
          userWallet: wallet.publicKey,
          userFirebaseUid: user.uid
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Vote submitted successfully')
        setDonationState("voted")
        setUserDonationStatus(prev => ({ ...prev, hasVoted: true }))
        toast.success("Thank you for your feedback!")
        
        // Return to idle state after a short delay to allow multiple donations
        setTimeout(() => {
          setDonationState("idle")
        }, 3000)
      } else {
        console.error('❌ Vote failed:', result.error)
        toast.error(result.error || "Failed to submit vote")
      }
    } catch (error: any) {
      console.error('❌ Error submitting vote:', error)
      toast.error(error.message || "Failed to submit vote")
    }
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
            <span className="font-bold text-teal-600 dark:text-teal-400">${(need.amountRaised / 100).toLocaleString()}</span>
            <span className="text-muted-foreground">raised of ${(need.amountNeeded / 100).toLocaleString()}</span>
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
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-semibold">To Wallet:</p>
              <p className="text-muted-foreground break-all bg-muted p-2 rounded-md">{need.walletAddress}</p>
            </div>
            
            {wallet?.privateKey ? (
              <Button 
                size="lg" 
                className="w-full bg-teal-500 hover:bg-teal-600 text-white" 
                onClick={() => processDonation(wallet.privateKey!)}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Donate {amount ? `${amount} XLM` : ""} with Stellar
              </Button>
            ) : (
              <PinProtectedAction
                onUnlockSuccess={handleProtectedDonation}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
                size="lg"
              >
                Unlock & Donate {amount ? `${amount} XLM` : ""}
              </PinProtectedAction>
            )}
          </div>
        )}

        {donationState === "processing" && (
          <div className="flex items-center justify-center flex-col text-center space-y-2 h-48">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            <p className="font-semibold">Processing Donation...</p>
            <p className="text-sm text-muted-foreground">Sending {amount} XLM to beneficiary...</p>
            <p className="text-xs text-muted-foreground">This may take 1-2 minutes to confirm on the blockchain.</p>
          </div>
        )}

        {donationState === "success" && !userDonationStatus.hasVoted && (
          <div className="space-y-4 border-t pt-6">
            {donationResult && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-green-600">Donation Successful!</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-semibold">{donationResult.amount} XLM</span>
                  </div>
                  {donationResult.transactionHash && (
                    <div className="space-y-1">
                      <p className="font-semibold">Transaction:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted p-1 rounded flex-1 break-all">
                          {donationResult.transactionHash}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${donationResult.transactionHash}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <ReputationVote onVote={handleVote} />
          </div>
        )}

        {donationState === "voted" && (
          <div className="flex items-center justify-center flex-col text-center space-y-2 h-48">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="font-semibold">Thank you for your donation and feedback!</p>
            <p className="text-sm text-muted-foreground">Your support helps build a more trustworthy community.</p>
          </div>
        )}
        
        {/* Show vote option if user has donated but hasn't voted yet */}
        {userDonationStatus.hasDonated && !userDonationStatus.hasVoted && donationState === "idle" && (
          <div className="space-y-4 border-t pt-6">
            <div className="text-center space-y-2">
              <p className="font-semibold text-green-600">You have supported this need!</p>
              <p className="text-sm text-muted-foreground">Would you like to share your feedback?</p>
            </div>
            <ReputationVote onVote={handleVote} />
          </div>
        )}
        
        {/* Show donation history if user has donated before */}
        {userDonationStatus.hasDonated && donationState === "idle" && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your contribution:</span>
              <span className="font-medium text-green-600">Thank you for your support!</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">You can donate again to help reach the goal.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}