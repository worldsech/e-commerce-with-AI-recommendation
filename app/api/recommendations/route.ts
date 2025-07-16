import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Mock recommendations for demo mode
    const mockRecommendations = [
      {
        id: "rec_1",
        name: "AI Recommended Headphones",
        description: "Based on your browsing history - Premium wireless headphones with superior sound quality",
        price: 179.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Electronics",
      },
      {
        id: "rec_2",
        name: "Smart Fitness Tracker",
        description: "Perfect for your active lifestyle - Advanced health monitoring with GPS tracking",
        price: 249.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Fitness",
      },
      {
        id: "rec_3",
        name: "Eco-Friendly Water Bottle",
        description: "Sustainable choice for hydration - Made from recycled materials with temperature control",
        price: 34.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Lifestyle",
      },
      {
        id: "rec_4",
        name: "Wireless Charging Station",
        description: "Convenient charging solution - Multi-device wireless charger for your desk",
        price: 89.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Electronics",
      },
    ]

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      console.log("Gemini API key not configured, using mock recommendations")
      return NextResponse.json({
        recommendations: mockRecommendations,
        message: "Demo recommendations - Gemini API not configured",
        isDemoMode: true,
      })
    }

    // Check Firebase availability first
    try {
      const { db, isFirebaseAvailable } = await import("@/lib/firebase")

      if (!isFirebaseAvailable || !db) {
        console.log("Firebase not available, using mock recommendations")
        return NextResponse.json({
          recommendations: mockRecommendations,
          message: "Demo recommendations - Firebase not available",
          isDemoMode: true,
        })
      }

      // Try to fetch user data and products
      const { collection, getDocs, query, where } = await import("firebase/firestore")

      const [ordersSnapshot, wishlistSnapshot, productsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "orders"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, "wishlists"), where("userId", "==", userId))).catch(() => ({ docs: [] })),
        getDocs(collection(db, "products")).catch(() => ({ docs: [] })),
      ])

      const userOrders = ordersSnapshot.docs.map((doc) => doc.data())
      const userWishlist = wishlistSnapshot.docs.map((doc) => doc.data())
      const allProducts = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // If no products in database, use mock recommendations
      if (allProducts.length === 0) {
        console.log("No products in database, using mock recommendations")
        return NextResponse.json({
          recommendations: mockRecommendations,
          message: "Demo recommendations - No products in database",
          isDemoMode: true,
        })
      }

      // Get user's interaction history
      const userInteractions = [
        ...userOrders.flatMap((order) => order.items || []),
        ...userWishlist.map((item) => item.productId),
      ]

      // If no user interactions, return popular products or mock recommendations
      if (userInteractions.length === 0) {
        const popularProducts = allProducts.slice(0, 4)
        return NextResponse.json({
          recommendations: popularProducts.length > 0 ? popularProducts : mockRecommendations,
          message: "Popular products - No user history available",
          isDemoMode: popularProducts.length === 0,
        })
      }

      // Try to use Gemini AI for recommendations
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai")

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        // Create a more robust prompt
        const interactedProducts = allProducts.filter((product) => userInteractions.includes(product.id))

        const prompt = `You are a product recommendation system. Based on the user's interaction with these products:
${interactedProducts.map((p) => `- ${p.name}: ${p.description} (Category: ${p.category})`).join("\n")}

From this available product catalog:
${allProducts.map((p) => `${p.id}|${p.name}|${p.description}|${p.category}`).join("\n")}

Please recommend 4 product IDs that would be most relevant to this user. Consider:
1. Similar categories
2. Complementary products
3. Similar price ranges
4. Product descriptions

Return only the product IDs separated by commas, nothing else.`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text().trim()

        if (!text) {
          throw new Error("Empty response from Gemini API")
        }

        const recommendedIds = text
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
        const recommendations = allProducts.filter((product) => recommendedIds.includes(product.id)).slice(0, 4)

        if (recommendations.length > 0) {
          return NextResponse.json({
            recommendations,
            message: "AI-powered recommendations",
            isDemoMode: false,
          })
        } else {
          throw new Error("No valid product IDs returned from AI")
        }
      } catch (aiError: any) {
        console.error("Gemini AI error:", aiError.message || aiError)

        // Fallback to simple recommendation logic
        const interactedProducts = allProducts.filter((product) => userInteractions.includes(product.id))
        const interactedCategories = [...new Set(interactedProducts.map((p) => p.category))]

        // Find products in similar categories
        const similarProducts = allProducts
          .filter(
            (product) => interactedCategories.includes(product.category) && !userInteractions.includes(product.id),
          )
          .slice(0, 4)

        if (similarProducts.length > 0) {
          return NextResponse.json({
            recommendations: similarProducts,
            message: "Category-based recommendations - AI service unavailable",
            isDemoMode: false,
          })
        }

        // Final fallback to random products
        const randomProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 4)
        return NextResponse.json({
          recommendations: randomProducts.length > 0 ? randomProducts : mockRecommendations,
          message: "Random recommendations - AI service unavailable",
          isDemoMode: randomProducts.length === 0,
        })
      }
    } catch (firebaseError) {
      console.error("Firebase error:", firebaseError)
      return NextResponse.json({
        recommendations: mockRecommendations,
        message: "Demo recommendations - Database connection failed",
        isDemoMode: true,
      })
    }
  } catch (error: any) {
    console.error("General recommendation error:", error)

    // Final fallback recommendations
    const fallbackRecommendations = [
      {
        id: "fallback_1",
        name: "Popular Wireless Headphones",
        description: "Top-rated wireless headphones with excellent sound quality and long battery life",
        price: 159.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Electronics",
      },
      {
        id: "fallback_2",
        name: "Bestselling Smartwatch",
        description: "Feature-rich smartwatch for fitness tracking and smart notifications",
        price: 299.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Electronics",
      },
      {
        id: "fallback_3",
        name: "Premium Coffee Maker",
        description: "Professional-grade coffee maker for the perfect brew every time",
        price: 199.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Kitchen",
      },
      {
        id: "fallback_4",
        name: "Ergonomic Office Chair",
        description: "Comfortable office chair designed for long work sessions",
        price: 349.99,
        imageUrl: "/placeholder.svg?height=300&width=300",
        category: "Furniture",
      },
    ]

    return NextResponse.json({
      recommendations: fallbackRecommendations,
      message: "Fallback recommendations - Service temporarily unavailable",
      isDemoMode: true,
    })
  }
}
