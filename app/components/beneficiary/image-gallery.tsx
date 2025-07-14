"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: string[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0])

  return (
    <div className="grid gap-4">
      <div className="aspect-video overflow-hidden rounded-lg border">
        <img src={mainImage || "/placeholder.svg"} alt="Main need image" className="object-cover w-full h-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setMainImage(image)}
            className={cn(
              "aspect-square rounded-md overflow-hidden border-2",
              mainImage === image ? "border-teal-500" : "border-transparent",
            )}
          >
            <img
              src={image || "/placeholder.svg"}
              alt={`Thumbnail ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
