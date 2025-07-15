"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Loader2, CheckCircle, ExternalLink, Home } from "lucide-react"
import { useState, useEffect, use, type ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/WalletContext"
import { useAuth } from "@/contexts/AuthContext"
import { uploadReportImages, generateTempReportId } from "@/lib/firebase-storage"
import { toast } from "sonner"
import { PinProtectedAction } from "@/components/pin-protected-action"

interface Need {
  id: string
  title: string
  description: string
  location: string
  category: string
  amountNeeded: number
  amountRaised: number
  status: "Pending" | "Verified" | "Funded"
  imageUrl: string
  imageUrls: string[]
  creator: string
  createdAt: number
  updatedAt: number
  verificationNotes: string
}

interface TransactionResult {
  reportId: string
  message: string
  contractId: string
  userAddress: string
  transactionHash?: string
}

export default function EditNeedPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { wallet } = useWallet()
  const { user } = useAuth()
  const router = useRouter()
  
  // Need data state
  const [need, setNeed] = useState<Need | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null)
  
  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [amountNeeded, setAmountNeeded] = useState("")
  const [reason, setReason] = useState("")

  // Fetch need data on component mount
  useEffect(() => {
    const fetchNeed = async () => {
      if (!resolvedParams.id) return

      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching need data for ID:', resolvedParams.id)

        // Use direct SDK route in development, rewrite handles it in production
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname.includes('ngrok.io') ||
                             process.env.NODE_ENV === 'development'
        const apiUrl = isDevelopment
          ? `/api/vercel/soroban/need-reports/get?reportId=${resolvedParams.id}`
          : `/api/soroban/need-reports/get?reportId=${resolvedParams.id}`
        
        console.log('🌍 Environment:', process.env.NODE_ENV)
        console.log('🌐 Hostname:', window.location.hostname)
        console.log('🔧 isDevelopment:', isDevelopment)
        console.log('🔗 API URL:', apiUrl)

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (response.ok && data.success && data.reports) {
          const needData = data.reports
          console.log('✅ Need data loaded:', needData)
          
          setNeed(needData)
          setTitle(needData.title || "")
          setDescription(needData.description || "")
          setLocation(needData.location || "")
          setCategory(needData.category || "")
          setAmountNeeded((needData.amountNeeded / 100).toString()) // Convert from cents
          setImagePreviews(needData.imageUrls || [])
        } else {
          console.error('❌ Failed to fetch need:', data.error)
          setError(data.error || 'Failed to fetch need data')
          toast.error('Failed to load need data')
        }
      } catch (error: any) {
        console.error('❌ Error fetching need:', error)
        setError('Failed to load need data')
        toast.error('Failed to load need data')
      } finally {
        setLoading(false)
      }
    }

    fetchNeed()
  }, [resolvedParams.id])

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
    const newPreviews = [...imagePreviews]

    // If it's a newly uploaded image (blob URL), remove from files and revoke URL
    if (newPreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index])
      // Find and remove the corresponding file
      const fileIndex = index - (imagePreviews.length - images.length)
      if (fileIndex >= 0) {
        newImages.splice(fileIndex, 1)
        setImages(newImages)
      }
    }
    
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
  }

  const performFormSubmission = async (privateKey: string) => {
    if (!reason.trim()) {
      console.error('❌ Missing reason for update')
      toast.error("Please provide a reason for this update")
      return
    }

    console.log('✅ Form validation passed, proceeding with update...')
    console.log('- Title:', title.substring(0, 30) + '...')
    console.log('- Reason:', reason.substring(0, 50) + '...')
    console.log('- Images count:', images.length)

    setIsSubmitting(true)

    try {
      let allImageUrls = [...imagePreviews.filter(url => !url.startsWith("blob:"))]

      // Upload new images to Firebase Storage if any
      if (images.length > 0) {
        console.log('📸 Uploading', images.length, 'new images...')
        toast.info("Uploading new images...")
        const tempReportId = generateTempReportId()
        const uploadResults = await uploadReportImages(images, tempReportId)
        const newImageUrls = uploadResults.map(result => result.url)
        allImageUrls = [...allImageUrls, ...newImageUrls]
        console.log('✅ New images uploaded successfully:', newImageUrls.length)
        toast.success(`${images.length} new image(s) uploaded successfully`)
      }

      // Update report on smart contract
      console.log('🔗 Updating need report on blockchain...')
      toast.info("Updating need report on blockchain... This may take 1-2 minutes.")
      
      const updateData: any = {
        userPrivateKey: privateKey,
        reportId: resolvedParams.id,
        reason
      }

      // Only include fields that have changed
      if (title !== need?.title) updateData.title = title
      if (description !== need?.description) updateData.description = description
      if (location !== need?.location) updateData.location = location
      if (category !== need?.category) updateData.category = category
      
      const newAmountCents = Math.round(parseFloat(amountNeeded) * 100)
      if (newAmountCents !== need?.amountNeeded) updateData.amountNeeded = newAmountCents
      
      if (JSON.stringify(allImageUrls) !== JSON.stringify(need?.imageUrls)) {
        updateData.imageUrls = allImageUrls
      }

      console.log('📤 Sending update request to API:', {
        ...updateData,
        userPrivateKey: '[REDACTED]'
      })
      
      // Use direct SDK route in development, rewrite handles it in production
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('ngrok.io') ||
                           process.env.NODE_ENV === 'development'
      const updateApiUrl = isDevelopment
        ? '/api/vercel/soroban/need-reports/update'
        : '/api/soroban/need-reports/update'
      
      console.log('🔧 Update API URL:', updateApiUrl)
      
      const response = await fetch(updateApiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()
      console.log('📥 API response:', result)

      if (result.success) {
        console.log('✅ Need report updated successfully!')
        
        // Store transaction result and show success dialog
        setTransactionResult({
          reportId: result.reportId,
          message: result.message,
          contractId: result.contractId,
          userAddress: result.userAddress,
          transactionHash: result.transactionHash
        })
        setShowSuccessDialog(true)
        
        console.log("Report updated with ID:", result.reportId)
      } else {
        console.error('❌ API returned error:', result.error)
        throw new Error(result.error || "Failed to update need report")
      }
    } catch (error: any) {
      console.error("❌ Error updating need report:", error)
      console.error('- Error type:', error?.constructor?.name)
      console.error('- Error message:', error?.message)
      toast.error(error.message || "Failed to update need report")
    } finally {
      setIsSubmitting(false)
      console.log('📝 Form submission completed')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      console.error('❌ No user logged in')
      toast.error("Please log in to update a need report")
      return
    }

    // Check if user is the creator of this need
    if (need?.creator !== wallet?.publicKey) {
      console.error('❌ User is not the creator of this need')
      toast.error("You can only edit needs that you created")
      return
    }

    // If wallet is already unlocked, submit directly
    if (wallet?.privateKey) {
      await performFormSubmission(wallet.privateKey)
    }
    // If wallet is not unlocked, the PinProtectedAction component will handle it
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Loading need data...</h2>
            <p className="text-muted-foreground mt-2">Fetching information from the blockchain</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !need) {
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
          <div className="text-center py-16 border-2 border-dashed border-red-200 dark:border-red-800 rounded-lg">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error loading need</h2>
            <p className="text-muted-foreground mt-2">{error || 'Need not found'}</p>
            <Link href="/dashboard/beneficiary">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/beneficiary/needs/${resolvedParams.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel Edit
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Emergency Report</CardTitle>
            <CardDescription>
              Update the details of your report. All changes will be logged for transparency.
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
                <Label>Evidence Images</Label>
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
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Update *</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you are making these changes..."
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  All changes are logged for transparency. Please provide a clear reason for this update.
                </p>
              </div>

              {wallet?.privateKey ? (
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !reason.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Report...
                    </>
                  ) : (
                    "Save Changes & Submit for Re-verification"
                  )}
                </Button>
              ) : (
                <PinProtectedAction
                  onUnlockSuccess={handleProtectedSubmit}
                  disabled={isSubmitting || !reason.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Report...
                    </>
                  ) : (
                    "Unlock & Save Changes"
                  )}
                </PinProtectedAction>
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
              Report Updated Successfully!
            </DialogTitle>
            <DialogDescription>
              Your emergency report has been successfully updated on the blockchain.
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
                  
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm font-medium block mb-2">Transaction:</span>
                    {transactionResult.transactionHash ? (
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-orange-700 dark:text-orange-400 break-all">
                          {transactionResult.transactionHash}
                        </span>
                        <div className="text-xs text-orange-600 dark:text-orange-300">
                          ✅ Verified on Stellar Testnet
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-orange-600 dark:text-orange-300">
                        Transaction completed successfully (hash not available)
                      </div>
                    )}
                  </div>
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
            
            {transactionResult?.transactionHash ? (
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
                View Transaction on Stellar Explorer
              </Button>
            ) : (
              <Button 
                variant="outline" 
                disabled
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Transaction Hash Not Available
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