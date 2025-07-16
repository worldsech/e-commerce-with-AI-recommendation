"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { collection, getDocs } from "firebase/firestore" // Removed addDoc, updateDoc, deleteDoc
import { db, isFirebaseAvailable as checkFirebaseInitialized } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, ImageOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"
import { useActionState } from "react" // Import useActionState
import {
  addProductAction, // New Server Action import
  updateProductAction, // New Server Action import
  deleteProductAction, // New Server Action import
} from "@/app/actions/product-actions" // Path to new Server Actions
import { Alert, AlertDescription } from "@/components/ui/alert" // Ensure Alert is imported
import { useAuth } from "@/components/auth-provider" // Declare useAuth hook

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

export default function AdminPage() {
  const { user, loading, isFirebaseAvailable } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // State for new product form (client-side only for input values)
  const [newProductName, setNewProductName] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("0")
  const [newProductCategory, setNewProductCategory] = useState("")
  const [newProductImageFile, setNewProductImageFile] = useState<File | null>(null)
  const [newProductImagePreviewUrl, setNewProductImagePreviewUrl] = useState<string | null>(null)

  // State for edit product form (client-side only for input values)
  const [editProductName, setEditProductName] = useState("")
  const [editProductDescription, setEditProductDescription] = useState("")
  const [editProductPrice, setEditProductPrice] = useState("0")
  const [editProductCategory, setEditProductCategory] = useState("")
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null)
  const [editProductImagePreviewUrl, setEditProductImagePreviewUrl] = useState<string | null>(null)
  const [editProductCurrentImageUrl, setEditProductCurrentImageUrl] = useState<string>("")

  // Server Action states
  const [addState, addAction] = useActionState(addProductAction, null)
  const [updateState, updateAction] = useActionState(updateProductAction, null)
  const [deleteState, deleteAction] = useActionState(deleteProductAction, null)

  // Simple admin check - in production, you'd want proper role-based access
  const isAdmin = user?.email === "admin@shopsmart.com"

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login")
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    fetchProducts()
  }, [user, isAdmin, isFirebaseAvailable, addState, updateState, deleteState]) // Re-fetch on action completion

  useEffect(() => {
    if (addState?.success) {
      toast({ title: "Product added", description: addState.message })
      setIsAddDialogOpen(false)
      // Reset form fields
      setNewProductName("")
      setNewProductDescription("")
      setNewProductPrice("0")
      setNewProductCategory("")
      setNewProductImageFile(null)
      setNewProductImagePreviewUrl(null)
    } else if (addState?.success === false) {
      toast({ title: "Error", description: addState.message, variant: "destructive" })
    }
  }, [addState, toast])

  useEffect(() => {
    if (updateState?.success) {
      toast({ title: "Product updated", description: updateState.message })
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      // Reset edit form fields
      setEditProductName("")
      setEditProductDescription("")
      setEditProductPrice("0")
      setEditProductCategory("")
      setEditProductImageFile(null)
      setEditProductImagePreviewUrl(null)
      setEditProductCurrentImageUrl("")
    } else if (updateState?.success === false) {
      toast({ title: "Error", description: updateState.message, variant: "destructive" })
    }
  }, [updateState, toast])

  useEffect(() => {
    if (deleteState?.success) {
      toast({ title: "Product deleted", description: deleteState.message })
    } else if (deleteState?.success === false) {
      toast({ title: "Error", description: deleteState.message, variant: "destructive" })
    }
  }, [deleteState, toast])

  const fetchProducts = async () => {
    if (!user || !isAdmin || !isFirebaseAvailable || !checkFirebaseInitialized) {
      setDataLoading(false)
      setDataError("Firebase not available or user is not an admin.")
      return
    }

    setDataLoading(true)
    setDataError(null)
    try {
      const querySnapshot = await getDocs(collection(db, "products"))
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
      setProducts(productsData)
    } catch (error: any) {
      console.error("Error fetching products:", error)
      setDataError(error.message || "Failed to load products. Check Firebase rules.")
      toast({
        title: "Data Load Error",
        description: error.message || "Failed to load products. Check Firebase Security Rules.",
        variant: "destructive",
      })
    } finally {
      setDataLoading(false)
    }
  }

  const handleNewProductImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewProductImageFile(file)
      setNewProductImagePreviewUrl(URL.createObjectURL(file))
    } else {
      setNewProductImageFile(null)
      setNewProductImagePreviewUrl(null)
    }
  }

  const handleEditProductImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setEditProductImageFile(file)
      setEditProductImagePreviewUrl(URL.createObjectURL(file))
    } else {
      setEditProductImageFile(null)
      setEditProductImagePreviewUrl(null)
    }
  }

  const handleAddProductSubmit = async (formData: FormData) => {
    if (newProductImageFile) {
      formData.append("image", newProductImageFile)
    }
    addAction(formData)
  }

  const handleUpdateProductSubmit = async (formData: FormData) => {
    if (!editingProduct) return

    formData.append("productId", editingProduct.id)
    formData.append("currentImageUrl", editingProduct.imageUrl) // Pass current image URL to retain if no new image
    if (editProductImageFile) {
      formData.append("image", editProductImageFile)
    }
    updateAction(formData)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!isFirebaseAvailable || !checkFirebaseInitialized) {
      toast({
        title: "Error",
        description: "Firebase is not available.",
        variant: "destructive",
      })
      return
    }
    deleteAction(productId)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin dashboard...</div>
  }

  if (!user || !isAdmin) {
    return null // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isFirebaseAvailable}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Fill in the details to add a new product to the store.</DialogDescription>
              </DialogHeader>
              <form action={handleAddProductSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name" // Added name attribute for FormData
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description" // Added name attribute for FormData
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price" // Added name attribute for FormData
                      type="text"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category" // Added name attribute for FormData
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <Input
                    id="image"
                    name="image" // Added name attribute for FormData
                    type="file"
                    accept="image/*"
                    onChange={handleNewProductImageSelect}
                    className="flex-1"
                    disabled={!isFirebaseAvailable}
                  />
                  {newProductImagePreviewUrl && (
                    <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden">
                      <Image
                        src={newProductImagePreviewUrl || "/placeholder.svg"}
                        alt="Image Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {addState?.success === false && addState.message.includes("upload failed") && (
                    <Alert variant="destructive" className="mt-2">
                      <ImageOff className="h-4 w-4" />
                      <AlertDescription>Image Upload Error</AlertDescription>
                      <div className="text-sm">{addState.message}</div>
                    </Alert>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={addState?.pending || !isFirebaseAvailable}>
                  {addState?.pending ? "Adding Product..." : "Add Product"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {dataError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription>Data Error</AlertDescription>
            <div className="text-red-800">
              <strong>{dataError}</strong>
            </div>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your store products</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div>Loading products...</div>
            ) : products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingProduct(product)
                              setEditProductName(product.name)
                              setEditProductDescription(product.description)
                              setEditProductPrice(product.price.toString())
                              setEditProductCategory(product.category)
                              setEditProductCurrentImageUrl(product.imageUrl)
                              setEditProductImageFile(null) // Clear file input
                              setEditProductImagePreviewUrl(null) // Clear preview
                              setIsEditDialogOpen(true)
                            }}
                            disabled={!isFirebaseAvailable}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={!isFirebaseAvailable || deleteState?.pending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-600">No products found. Add some using the "Add Product" button.</p>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update the product details.</DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <form action={handleUpdateProductSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Product Name</Label>
                  <Input
                    id="editName"
                    name="name"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    name="description"
                    value={editProductDescription}
                    onChange={(e) => setEditProductDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPrice">Price</Label>
                    <Input
                      id="editPrice"
                      name="price"
                      type="number"
                      step="0.01"
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCategory">Category</Label>
                    <Input
                      id="editCategory"
                      name="category"
                      value={editProductCategory}
                      onChange={(e) => setEditProductCategory(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editImage">Product Image</Label>
                  <Input
                    id="editImage"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditProductImageSelect}
                  />
                  {(editProductImagePreviewUrl || editProductCurrentImageUrl) && (
                    <div className="mt-2 relative w-32 h-32 border rounded-md overflow-hidden">
                      <Image
                        src={editProductImagePreviewUrl || editProductCurrentImageUrl || "/placeholder.svg"}
                        alt="Current Image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {updateState?.success === false && updateState.message.includes("upload failed") && (
                    <Alert variant="destructive" className="mt-2">
                      <ImageOff className="h-4 w-4" />
                      <AlertDescription>Image Upload Error</AlertDescription>
                      <div className="text-sm">{updateState.message}</div>
                    </Alert>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={updateState?.pending}>
                  {updateState?.pending ? "Updating Product..." : "Update Product"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
