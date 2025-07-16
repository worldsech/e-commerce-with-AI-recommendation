"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { collection, query, where, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
import Image from "next/image"

interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    name: string
    price: number
    imageUrl: string
    description: string
  }
}

export default function CartPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) return

      try {
        const cartQuery = query(collection(db, "carts"), where("userId", "==", user.uid))
        const cartSnapshot = await getDocs(cartQuery)
        const cartData = cartSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Fetch product details for each cart item
        const productsQuery = query(collection(db, "products"))
        const productsSnapshot = await getDocs(productsQuery)
        const products = productsSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() }
          return acc
        }, {} as any)

        const cartWithProducts = cartData
          .map((item) => ({
            ...item,
            product: products[item.productId],
          }))
          .filter((item) => item.product) as CartItem[]

        setCartItems(cartWithProducts)
      } catch (error) {
        console.error("Error fetching cart items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCartItems()
  }, [user])

  const removeFromCart = async (cartItemId: string) => {
    try {
      await deleteDoc(doc(db, "carts", cartItemId))
      setCartItems(cartItems.filter((item) => item.id !== cartItemId))
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      })
    }
  }

  const checkout = async () => {
    if (!user || cartItems.length === 0) return

    try {
      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total,
        status: "completed",
        createdAt: new Date(),
      })

      // Clear cart
      for (const item of cartItems) {
        await deleteDoc(doc(db, "carts", item.id))
      }

      setCartItems([])
      toast({
        title: "Order placed successfully!",
        description: `Your order of $${total.toFixed(2)} has been placed.`,
      })
    } catch (error) {
      toast({
        title: "Checkout failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (loading || isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <Button onClick={() => router.push("/")}>Continue Shopping</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-20 h-20">
                        <Image
                          src={item.product.imageUrl || "/placeholder.svg?height=80&width=80"}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <p className="text-gray-600 text-sm">{item.product.description}</p>
                        <p className="text-lg font-bold text-primary">${item.product.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Qty: {item.quantity}</span>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button onClick={checkout} className="w-full" size="lg">
                    Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
