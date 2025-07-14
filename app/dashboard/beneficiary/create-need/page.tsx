"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import { useState, type ChangeEvent, FormEvent } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { uploadReportImages, generateTempReportId } from "@/lib/firebase-storage"
import { toast } from "sonner"

export default function CreateNeedPage() {
  const { wallet } = useWallet()
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [amountNeeded, setAmountNeeded] = useState("")

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!wallet) {
      toast.error("Please unlock your wallet first")
      return
    }

    if (!title || !description || !location || !category || !amountNeeded) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = parseFloat(amountNeeded)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrls: string[] = []

      // Upload images to Firebase Storage if any
      if (images.length > 0) {
        toast.info("Uploading images...")
        const tempReportId = generateTempReportId()
        const uploadResults = await uploadReportImages(images, tempReportId)
        imageUrls = uploadResults.map(result => result.url)
        toast.success(`${images.length} image(s) uploaded successfully`)
      }

      // Create report on smart contract
      toast.info("Creating need report on blockchain...")
      
      const response = await fetch('/api/soroban/need-reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrivateKey: wallet.privateKey,
          title,
          description,
          location,
          category,
          amountNeeded: Math.round(amount * 100), // Convert to cents/stroops
          imageUrls
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Need report created successfully!")
        
        // Reset form
        setTitle("")
        setDescription("")
        setLocation("")
        setCategory("")
        setAmountNeeded("")
        setImages([])
        setImagePreviews([])
        
        // TODO: Redirect to report details or dashboard
        console.log("Report created with ID:", result.reportId)
      } else {
        throw new Error(result.error || "Failed to create need report")
      }
    } catch (error: any) {
      console.error("Error creating need report:", error)
      toast.error(error.message || "Failed to create need report")
    } finally {
      setIsSubmitting(false)
    }
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
                  value={wallet?.publicKey || "Please unlock your wallet"}
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
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !wallet}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Report...
                  </>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
              {!wallet && (
                <p className="text-sm text-muted-foreground text-center">
                  Please unlock your wallet to create a need report
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
