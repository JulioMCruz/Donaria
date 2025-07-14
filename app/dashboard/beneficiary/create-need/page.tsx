"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Loader2, Lock, CheckCircle, ExternalLink, Home } from "lucide-react"
import { useState, useEffect, type ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/WalletContext"
import { useAuth } from "@/contexts/AuthContext"
import { uploadReportImages, generateTempReportId } from "@/lib/firebase-storage"
import { toast } from "sonner"
import { PinProtectedAction } from "@/components/pin-protected-action"

interface TransactionResult {
  reportId: number
  message: string
  contractId: string
  userAddress: string
  transactionHash?: string
}

export default function CreateNeedPage() {
  const { wallet, connectWallet } = useWallet()
  const { user } = useAuth()
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userPublicKey, setUserPublicKey] = useState<string>("")
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null)
  
  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [amountNeeded, setAmountNeeded] = useState("")

  // Fetch user's wallet data from API
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!user?.uid) return

      try {
        setLoadingWallet(true)
        const response = await fetch(`/api/users/wallet?firebaseUid=${user.uid}`)
        const data = await response.json()
        
        if (response.ok && data.exists && data.publicKey) {
          setUserPublicKey(data.publicKey)
        }
      } catch (error) {
        console.error('Error fetching user wallet:', error)
        toast.error('Failed to load wallet information')
      } finally {
        setLoadingWallet(false)
      }
    }

    fetchUserWallet()
  }, [user?.uid])

  const handleProtectedSubmit = async (privateKey: string, publicKey: string) => {
    console.log('🚀 Executing protected form submission...')
    console.log('- Private key available:', !!privateKey)
    console.log('- Public key:', publicKey.substring(0, 10) + '...')
    
    // Execute the form submission logic with the unlocked wallet
    await performFormSubmission(privateKey)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const newImages = [...images, ...filesArray]
      setImages(newImages)

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    const newPreviews = [...imagePreviews]
    URL.revokeObjectURL(newPreviews[index]) // Clean up memory
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
  }

  const performFormSubmission = async (privateKey: string) => {
    if (!title || !description || !location || !category || !amountNeeded) {
      console.error('❌ Missing required fields')
      toast.error("Please fill in all required fields")
      return
    }

    const amount = parseFloat(amountNeeded)
    if (isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount:', amountNeeded)
      toast.error("Please enter a valid amount")
      return
    }

    console.log('✅ Form validation passed, proceeding with submission...')
    console.log('- Title:', title.substring(0, 30) + '...')
    console.log('- Amount:', amount)
    console.log('- Images count:', images.length)

    setIsSubmitting(true)

    try {
      let imageUrls: string[] = []

      // Upload images to Firebase Storage if any
      if (images.length > 0) {
        console.log('📸 Uploading', images.length, 'images...')
        toast.info("Uploading images...")
        const tempReportId = generateTempReportId()
        const uploadResults = await uploadReportImages(images, tempReportId)
        imageUrls = uploadResults.map(result => result.url)
        console.log('✅ Images uploaded successfully:', imageUrls.length)
        toast.success(`${images.length} image(s) uploaded successfully`)
      }

      // Create report on smart contract
      console.log('🔗 Creating need report on blockchain...')
      toast.info("Creating need report on blockchain... This may take 1-2 minutes.")
      
      const requestData = {
        userPrivateKey: privateKey,
        title,
        description,
        location,
        category,
        amountNeeded: Math.round(amount * 100), // Convert to cents/stroops
        imageUrls
      }
      console.log('📤 Sending request to API:', {
        ...requestData,
        userPrivateKey: '[REDACTED]'
      })
      
      let response: Response
      let result: any
      
      try {
        console.log('🌐 Making fetch request to API...')
        console.log('⏳ Note: Smart contract calls may take 30-60 seconds...')
        
        // Create an AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          console.log('⏰ Request timeout reached (2 minutes)')
          controller.abort()
        }, 120000) // 2 minute timeout
        
        response = await fetch('/api/soroban/need-reports/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('📥 API response received - status:', response.status)
        console.log('📥 API response headers:', Object.fromEntries(response.headers.entries()))
      } catch (fetchError: any) {
        console.error('❌ Fetch request failed:', fetchError)
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Smart contract calls can take up to 2 minutes.')
        }
        throw new Error(`Network request failed: ${fetchError}`)
      }

      try {
        console.log('📋 Parsing response JSON...')
        result = await response.json()
        console.log('📥 API response data:', result)
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError)
        console.log('📄 Raw response text:', await response.text())
        throw new Error(`Invalid JSON response: ${jsonError}`)
      }

      if (result.success) {
        console.log('✅ Need report created successfully!')
        
        // Store transaction result and show success dialog
        setTransactionResult({
          reportId: result.reportId,
          message: result.message,
          contractId: result.contractId,
          userAddress: result.userAddress,
          transactionHash: result.transactionHash
        })
        setShowSuccessDialog(true)
        
        // Reset form
        setTitle("")
        setDescription("")
        setLocation("")
        setCategory("")
        setAmountNeeded("")
        setImages([])
        setImagePreviews([])
        
        console.log("Report created with ID:", result.reportId)
      } else {
        console.error('❌ API returned error:', result.error)
        throw new Error(result.error || "Failed to create need report")
      }
    } catch (error: any) {
      console.error("❌ Error creating need report:", error)
      console.error('- Error type:', error?.constructor?.name)
      console.error('- Error message:', error?.message)
      toast.error(error.message || "Failed to create need report")
    } finally {
      setIsSubmitting(false)
      console.log('📝 Form submission completed')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      console.error('❌ No user logged in')
      toast.error("Please log in to create a need report")
      return
    }

    if (!userPublicKey) {
      console.error('❌ No user public key found')
      toast.error("Wallet not found. Please ensure you have a wallet associated with your account.")
      return
    }

    // If wallet is already unlocked, submit directly
    if (wallet?.privateKey) {
      await performFormSubmission(wallet.privateKey)
    }
    // If wallet is not unlocked, the PinProtectedAction component will handle it
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/beneficiary">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create a New Emergency Report</CardTitle>
            <CardDescription>
              Please provide as much detail as possible. Your report will be reviewed and verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Urgent Food Aid for Riverside Community"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the situation, who is affected, and what is most needed."
                  rows={5}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="place">Place / Location *</Label>
                  <Input
                    id="place"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Riverside, Central Province"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="food">Food & Water</SelectItem>
                      <SelectItem value="shelter">Shelter</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Needed (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amountNeeded}
                  onChange={(e) => setAmountNeeded(e.target.value)}
                  placeholder="e.g., 5000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet">Stellar Wallet Address</Label>
                <Input
                  id="wallet"
                  value={
                    loadingWallet 
                      ? "Loading wallet address..." 
                      : userPublicKey || "Wallet not found - please contact support"
                  }
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  This is your secure wallet for receiving funds. It is automatically generated and linked to your
                  account.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Upload Evidence</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-center mt-1 text-muted-foreground">Add Image</span>
                  </Label>
                </div>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              {wallet?.privateKey ? (
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !userPublicKey || loadingWallet}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Report...
                    </>
                  ) : loadingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Wallet...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              ) : (
                <PinProtectedAction
                  onUnlockSuccess={handleProtectedSubmit}
                  disabled={isSubmitting || !userPublicKey || loadingWallet}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Report...
                    </>
                  ) : loadingWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Wallet...
                    </>
                  ) : (
                    "Unlock & Submit for Verification"
                  )}
                </PinProtectedAction>
              )}
              {!userPublicKey && !loadingWallet && (
                <p className="text-sm text-muted-foreground text-center">
                  Wallet not found. Please ensure you have a wallet associated with your account.
                </p>
              )}
              {userPublicKey && !wallet?.privateKey && (
                <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  Click submit to unlock your wallet and create the report
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Report Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your emergency report has been successfully created and submitted to the blockchain.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {transactionResult && (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium">Report ID:</span>
                    <span className="text-sm font-mono text-green-700 dark:text-green-400">
                      #{transactionResult.reportId}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm text-blue-700 dark:text-blue-400">
                      {transactionResult.message.includes('app-sponsored') ? 'App-Sponsored' : 'User-Paid'}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm font-medium block mb-2">Wallet Address:</span>
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                      {transactionResult.userAddress}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-sm font-medium block mb-2">Smart Contract:</span>
                    <span className="text-xs font-mono text-purple-700 dark:text-purple-400 break-all">
                      {transactionResult.contractId}
                    </span>
                  </div>

                  {transactionResult.transactionHash && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-sm font-medium block mb-2">Transaction Hash:</span>
                      <span className="text-xs font-mono text-orange-700 dark:text-orange-400 break-all">
                        {transactionResult.transactionHash}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                setShowSuccessDialog(false)
                router.push('/dashboard/beneficiary')
              }}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            {transactionResult?.transactionHash && (
              <Button 
                variant="outline" 
                onClick={() => {
                  window.open(
                    `https://stellar.expert/explorer/testnet/tx/${transactionResult.transactionHash}`, 
                    '_blank'
                  )
                }}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Stellar Explorer
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
