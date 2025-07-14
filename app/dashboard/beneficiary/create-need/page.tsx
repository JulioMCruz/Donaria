"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useState, type ChangeEvent } from "react"

export default function CreateNeedPage() {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

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
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Emergency Report</CardTitle>
            <CardDescription>
              Please provide as much detail as possible. Your report will be reviewed and verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input id="title" placeholder="e.g., Urgent Food Aid for Riverside Community" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the situation, who is affected, and what is most needed."
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="place">Place / Location</Label>
                  <Input id="place" placeholder="e.g., Riverside, Central Province" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Needed (USD)</Label>
                  <Input id="amount" type="number" placeholder="e.g., 5000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet">Stellar Wallet Address</Label>
                <Input id="wallet" placeholder="Your auto-generated wallet address will appear here" readOnly />
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
              <Button type="submit" className="w-full" size="lg">
                Submit for Verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
