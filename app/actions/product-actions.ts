"use server"

import { v2 as cloudinary } from "cloudinary"
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" // Ensure db is imported and available on server

// Configure Cloudinary on the server
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Uploads a file to Cloudinary.
 * @param file The File object to upload.
 * @returns The secure URL of the uploaded image.
 */
async function uploadFileToCloudinary(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default", // Use environment variable for preset
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error)
              reject(new Error(`Cloudinary upload failed: ${error.message}`))
            } else if (result && result.secure_url) {
              resolve(result.secure_url)
            } else {
              reject(new Error("Cloudinary upload failed: No secure_url returned."))
            }
          },
        )
        .end(buffer)
    })
  } catch (error: any) {
    console.error("Error processing image for upload:", error)
    throw new Error(`Image processing failed: ${error.message}`)
  }
}

/**
 * Server Action to add a new product.
 * @param formData FormData containing product details and image file.
 */
export async function addProductAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const imageFile = formData.get("image") as File | null

  let imageUrl = ""
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadFileToCloudinary(imageFile)
    } catch (error: any) {
      return { success: false, message: `Image upload failed: ${error.message}` }
    }
  }

  try {
    await addDoc(collection(db, "products"), {
      name,
      description,
      price,
      imageUrl,
      category,
      createdAt: new Date(),
    })
    return { success: true, message: "Product added successfully!" }
  } catch (error: any) {
    console.error("Error adding product:", error)
    return { success: false, message: error.message || "Failed to add product." }
  }
}

/**
 * Server Action to update an existing product.
 * @param prevState The previous state from useActionState.
 * @param formData FormData containing updated product details and potentially a new image file.
 */
export async function updateProductAction(prevState: any, formData: FormData) {
  const productId = formData.get("productId") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const price = Number.parseFloat(formData.get("price") as string)
  const category = formData.get("category") as string
  const currentImageUrl = formData.get("currentImageUrl") as string // Existing image URL
  const imageFile = formData.get("image") as File | null // New image file

  let imageUrl = currentImageUrl // Default to current image URL
  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadFileToCloudinary(imageFile) // Upload new image
    } catch (error: any) {
      return { success: false, message: `Image upload failed: ${error.message}` }
    }
  }

  try {
    await updateDoc(doc(db, "products", productId), {
      name,
      description,
      price,
      imageUrl,
      category,
    })
    return { success: true, message: "Product updated successfully!" }
  } catch (error: any) {
    console.error("Error updating product:", error)
    return { success: false, message: error.message || "Failed to update product." }
  }
}

/**
 * Server Action to delete a product.
 * @param productId The ID of the product to delete.
 */
export async function deleteProductAction(productId: string) {
  try {
    await deleteDoc(doc(db, "products", productId))
    return { success: true, message: "Product deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting product:", error)
    return { success: false, message: error.message || "Failed to delete product." }
  }
}
