"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { ProductCard } from "@/components/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Lightbulb, RefreshCw, Settings } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

interface RecommendationResponse {
  recommendations: Product[]
  message?: string
  isDemoMode?: boolean
}

export function RecommendationSection() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const fetchRecommendations = async (isRetry = false) => {
    if (!user) return

    if (isRetry) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      })

      if (response.ok) {
        const data: RecommendationResponse = await response.json()
        setRecommendations(data.recommendations || [])
        setMessage(data.message || null)
        setIsDemoMode(data.isDemoMode || false)
        setError(null)
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error: any) {
      console.error("Error fetching recommendations:", error)
      setError(error.message || "Failed to load recommendations")

      // Set fallback recommendations on error
      const fallbackRecommendations: Product[] = [
        {
          id: "error_fallback_1",
          name: "Trending Wireless Earbuds",
          description: "Popular wireless earbuds with great sound quality - Fallback recommendation",
          price: 129.99,
          imageUrl: "/placeholder.svg?height=300&width=300",
          category: "Electronics",
        },
        {
          id: "error_fallback_2",
          name: "Smart Home Device",
          description: "Voice-controlled smart device for your home - Fallback recommendation",
          price: 89.99,
          imageUrl: "/placeholder.svg?height=300&width=300",
          category: "Electronics",
        },
      ]

      setRecommendations(fallbackRecommendations)
      setIsDemoMode(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [user])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    fetchRecommendations(true)
  }

  if (!user) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">Recommended for You</h2>
        </div>

        {!loading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Status Messages */}
      {message && (
        <Alert className={`mb-6 ${isDemoMode ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}`}>
          <AlertDescription className={isDemoMode ? "text-orange-800" : "text-blue-800"}>
            <div className="flex items-center justify-between">
              <span>
                <strong>{isDemoMode ? "Demo Mode:" : "Info:"}</strong> {message}
              </span>
              {isDemoMode && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/login">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Services
                  </a>
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>Error:</strong> {error}
              </span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No recommendations available at the moment.</p>
          <p className="text-sm text-gray-500 mb-4">Start shopping to get personalized suggestions!</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Retry Information */}
      {retryCount > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Retry attempts: {retryCount}</p>
        </div>
      )}
    </section>
  )
}
