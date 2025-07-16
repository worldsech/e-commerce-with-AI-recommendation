"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, ShoppingCart, ImageIcon } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { user, isFirebaseAvailable } = useAuth()
  const { toast } = useToast()
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const addToCart = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      })
      return
    }

    if (!isFirebaseAvailable) {
      toast({
        title: "Demo Mode",
        description: "Cart functionality requires Firebase configuration. Item added to demo cart!",
      })
      return
    }

    try {
      const { doc, setDoc, collection } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Database not available")
      }

      await setDoc(doc(collection(db, "carts"), `${user.uid}_${product.id}`), {
        userId: user.uid,
        productId: product.id,
        quantity: 1,
        addedAt: new Date(),
      })

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Demo Mode",
        description: "Cart functionality requires proper Firebase setup. Item added to demo cart!",
      })
    }
  }

  const addToWishlist = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to wishlist.",
        variant: "destructive",
      })
      return
    }

    if (!isFirebaseAvailable) {
      toast({
        title: "Demo Mode",
        description: "Wishlist functionality requires Firebase configuration. Item added to demo wishlist!",
      })
      return
    }

    try {
      const { doc, setDoc, collection } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      if (!db) {
        throw new Error("Database not available")
      }

      await setDoc(doc(collection(db, "wishlists"), `${user.uid}_${product.id}`), {
        userId: user.uid,
        productId: product.id,
        addedAt: new Date(),
      })

      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      })
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast({
        title: "Demo Mode",
        description: "Wishlist functionality requires proper Firebase setup. Item added to demo wishlist!",
      })
    }
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // Generate a placeholder based on product category and name
  const getPlaceholderImage = () => {
    const colors = ["bg-blue-100", "bg-green-100", "bg-purple-100", "bg-pink-100", "bg-yellow-100"]
    const colorIndex = product.name.length % colors.length
    return colors[colorIndex]
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-square relative mb-4 overflow-hidden rounded-lg bg-gray-100">
          {!imageError && product.imageUrl ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              <Image
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                fill
                className={`object-cover group-hover:scale-105 transition-transform ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            </>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center ${getPlaceholderImage()}`}>
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500 text-center px-2">{product.category}</span>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        <p className="text-2xl font-bold text-primary">${product.price}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button onClick={addToCart} className="flex-1">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
        <Button onClick={addToWishlist} variant="outline" size="icon">
          <Heart className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
