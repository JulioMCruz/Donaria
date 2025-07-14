import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export interface ImageUploadResult {
  url: string
  fileName: string
  reportId: string
}

/**
 * Upload images to Firebase Storage with report ID prefix
 * @param files - Array of File objects to upload
 * @param reportId - Report ID to use as prefix
 * @returns Promise<ImageUploadResult[]>
 */
export async function uploadReportImages(
  files: File[],
  reportId: string
): Promise<ImageUploadResult[]> {
  const uploadPromises = files.map(async (file) => {
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `need-reports/${reportId}/${fileName}`)
    
    try {
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return {
        url: downloadURL,
        fileName,
        reportId
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload ${file.name}`)
    }
  })

  return Promise.all(uploadPromises)
}

/**
 * Upload a single image to Firebase Storage
 * @param file - File object to upload
 * @param reportId - Report ID to use as prefix
 * @returns Promise<ImageUploadResult>
 */
export async function uploadSingleReportImage(
  file: File,
  reportId: string
): Promise<ImageUploadResult> {
  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `need-reports/${reportId}/${fileName}`)
  
  try {
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return {
      url: downloadURL,
      fileName,
      reportId
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw new Error(`Failed to upload ${file.name}`)
  }
}

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - Full URL of the image to delete
 * @returns Promise<void>
 */
export async function deleteReportImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
    
    if (!pathMatch) {
      throw new Error('Invalid image URL format')
    }
    
    const imagePath = decodeURIComponent(pathMatch[1])
    const imageRef = ref(storage, imagePath)
    
    await deleteObject(imageRef)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

/**
 * Generate a temporary report ID for image uploads before smart contract creation
 * @returns string
 */
export function generateTempReportId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Move images from temporary report ID to actual report ID
 * @param tempReportId - Temporary report ID used during upload
 * @param actualReportId - Actual report ID from smart contract
 * @param imageUrls - Array of image URLs to move
 * @returns Promise<string[]> - Array of new image URLs
 */
export async function moveReportImages(
  tempReportId: string,
  actualReportId: string,
  imageUrls: string[]
): Promise<string[]> {
  const movePromises = imageUrls.map(async (imageUrl) => {
    try {
      // Extract the file name from the URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      
      if (!pathMatch) {
        throw new Error('Invalid image URL format')
      }
      
      const imagePath = decodeURIComponent(pathMatch[1])
      const fileName = imagePath.split('/').pop()
      
      if (!fileName) {
        throw new Error('Could not extract file name')
      }
      
      // Create new path with actual report ID
      const newPath = `need-reports/${actualReportId}/${fileName}`
      const oldRef = ref(storage, imagePath)
      const newRef = ref(storage, newPath)
      
      // Download the file data
      const downloadUrl = await getDownloadURL(oldRef)
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      
      // Upload to new location
      await uploadBytes(newRef, blob)
      const newDownloadUrl = await getDownloadURL(newRef)
      
      // Delete old file
      await deleteObject(oldRef)
      
      return newDownloadUrl
    } catch (error) {
      console.error('Error moving image:', error)
      // Return original URL if move fails
      return imageUrl
    }
  })

  return Promise.all(movePromises)
}