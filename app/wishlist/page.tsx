"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ProductCard } from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

export default function WishlistPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchWishlistItems = async () => {
      if (!user) return

      try {
        const wishlistQuery = query(collection(db, "wishlists"), where("userId", "==", user.uid))
        const wishlistSnapshot = await getDocs(wishlistQuery)
        const wishlistProductIds = wishlistSnapshot.docs.map((doc) => doc.data().productId)

        if (wishlistProductIds.length > 0) {
          const productsQuery = query(collection(db, "products"))
          const productsSnapshot = await getDocs(productsQuery)
          const wishlistProducts = productsSnapshot.docs
            .filter((doc) => wishlistProductIds.includes(doc.id))
            .map((doc) => ({ id: doc.id, ...doc.data() })) as Product[]
          setWishlistItems(wishlistProducts)
        }
      } catch (error) {
        console.error("Error fetching wishlist items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWishlistItems()
  }, [user])

  if (loading || isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Wishlist</h1>

        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">Your wishlist is empty</p>
              <Button onClick={() => router.push("/")}>Discover Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
