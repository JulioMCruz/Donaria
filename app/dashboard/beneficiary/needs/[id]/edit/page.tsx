"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, X } from "lucide-react"
import { useState, type ChangeEvent } from "react"

// Mock data for the need being edited
const needToEdit = {
  id: "2",
  title: "Medical Supplies for Local Clinic",
  description:
    "Our local clinic was damaged in the recent earthquake and is running critically low on essential medical supplies, including bandages, antiseptics, and basic medication. Your support can help us restock and continue providing care to over 200 families in the area.",
  place: "Riverside, Central Province",
  amountNeeded: 2500,
  walletAddress: "GABC...XYZ",
  images: ["/medical-clinic-waiting-area.png", "/placeholder-8ospr.png"],
}

export default function EditNeedPage({ params }: { params: { id: string } }) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>(needToEdit.images)

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
    const newPreviews = [...imagePreviews]
    // If the image is a blob URL, revoke it
    if (newPreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index])
    }
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
    // Also remove from the File list if it exists there
    // This part needs more robust logic to map previews to files
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/beneficiary/needs/${params.id}`}>
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
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input id="title" defaultValue={needToEdit.title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" defaultValue={needToEdit.description} rows={5} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="place">Place / Location</Label>
                  <Input id="place" defaultValue={needToEdit.place} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Needed (USD)</Label>
                  <Input id="amount" type="number" defaultValue={needToEdit.amountNeeded} />
                </div>
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
              <Button type="submit" className="w-full" size="lg">
                Save Changes & Submit for Re-verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
