"use server"

import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Uploads a file to Cloudinary using a direct HTTP POST request (unsigned upload).
 * This bypasses the Cloudinary SDK's internal methods that might rely on Node.js 'crypto'.
 * @param file The File object to upload.
 * @returns The secure URL of the uploaded image.
 */
async function uploadFileToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  // Updated default upload preset name to "default" as per user's clarification
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default"

  // Log the values being used for debugging
  console.log("Cloudinary Upload Debug:")
  console.log("  Cloud Name:", cloudName)
  console.log("  Upload Preset:", uploadPreset)

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.")
  }
  if (!uploadPreset) {
    throw new Error("Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    if (data.secure_url) {
      return data.secure_url
    } else {
      throw new Error("Cloudinary upload failed: No secure_url returned in response.")
    }
  } catch (error: any) {
    console.error("Error uploading image to Cloudinary:", error)
    throw new Error(`Image upload failed: ${error.message}`)
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
