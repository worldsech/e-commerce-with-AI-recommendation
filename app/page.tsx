"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { ProductCard } from "@/components/product-card"
import { RecommendationSection } from "@/components/recommendation-section"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { checkFirebaseConfig } from "@/lib/firebase"

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

// Updated mock products with working image URLs and fallback placeholders
const mockProducts: Product[] = [
  {
    id: "mock_1",
    name: "Wireless Bluetooth Headphones",
    description: "Premium quality wireless headphones with noise cancellation and 30-hour battery life",
    price: 199.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
  },
  {
    id: "mock_2",
    name: "Smart Fitness Watch",
    description: "Advanced fitness tracking with heart rate monitor, GPS, and smartphone integration",
    price: 299.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
  },
  {
    id: "mock_3",
    name: "Organic Cotton T-Shirt",
    description: "Comfortable and sustainable organic cotton t-shirt available in multiple colors",
    price: 29.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Clothing",
  },
  {
    id: "mock_4",
    name: "Stainless Steel Water Bottle",
    description: "Insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours",
    price: 39.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Lifestyle",
  },
  {
    id: "mock_5",
    name: "Wireless Phone Charger",
    description: "Fast wireless charging pad compatible with all Qi-enabled devices",
    price: 49.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
  },
  {
    id: "mock_6",
    name: "Yoga Mat Premium",
    description: "Non-slip yoga mat made from eco-friendly materials with alignment guides",
    price: 79.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Fitness",
  },
  {
    id: "mock_7",
    name: "Coffee Maker Deluxe",
    description: "Programmable coffee maker with built-in grinder and thermal carafe",
    price: 159.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Kitchen",
  },
  {
    id: "mock_8",
    name: "LED Desk Lamp",
    description: "Adjustable LED desk lamp with USB charging port and touch controls",
    price: 89.99,
    imageUrl: "/placeholder.svg?height=300&width=300",
    category: "Home",
  },
]

export default function HomePage() {
  const { user, error: authError, isFirebaseAvailable } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      const config = checkFirebaseConfig()

      if (!config.isFirebaseAvailable) {
        // Use mock products when Firebase is not available
        setProducts(mockProducts)
        setError("Running in demo mode - Firebase not configured")
        setLoading(false)
        return
      }

      try {
        const { collection, getDocs } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        if (!db) {
          throw new Error("Firestore not available")
        }

        const querySnapshot = await getDocs(collection(db, "products"))
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[]

        // Use fetched products or fallback to mock products
        setProducts(productsData.length > 0 ? productsData : mockProducts)

        if (productsData.length === 0) {
          setError("No products found in database - showing demo products")
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setError("Using demo products - Database connection failed")
        setProducts(mockProducts)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Show status alerts */}
      {(authError || error) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {authError && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                <strong>Demo Mode:</strong> {authError}. Full functionality requires Firebase configuration.
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Info:</strong> {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Discover Amazing Products</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {isFirebaseAvailable ? "AI-powered recommendations just for you" : "Demo store with sample products"}
          </p>
          <Button size="lg" variant="secondary">
            Shop Now
          </Button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Recommendations Section - Only visible when logged in and Firebase is working */}
        {user && isFirebaseAvailable && (
          <div className="mb-12">
            <RecommendationSection />
          </div>
        )}

        {/* Products Section */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {isFirebaseAvailable ? "Featured Products" : "Demo Products"}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
