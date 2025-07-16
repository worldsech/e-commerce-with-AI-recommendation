"use client"

import { Alert, AlertTitle } from "@/components/ui/alert"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore"
import { updatePassword } from "firebase/auth"
import { db, isFirebaseAvailable as checkFirebaseInitialized } from "@/lib/firebase" // Renamed for clarity
import { useToast } from "@/hooks/use-toast"
import { ProductCard } from "@/components/product-card"
import { RecommendationSection } from "@/components/recommendation-section"
import { FirebaseStatus } from "@/components/firebase-status"
import { CloudinaryStatus } from "@/components/cloudinary-status" // New import

interface UserProfile {
  fullName: string
  email: string
  gender: string
  address?: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
}

export default function DashboardPage() {
  const { user, loading, isFirebaseAvailable } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([])
  const [newPassword, setNewPassword] = useState("")
  const [updating, setUpdating] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !isFirebaseAvailable || !checkFirebaseInitialized) {
        setDataLoading(false)
        setDataError("Firebase is not available or not configured.")
        return
      }

      setDataLoading(true)
      setDataError(null)
      try {
        // Fetch user profile
        console.log("Fetching data for user UID:", user.uid) // Added for debugging
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile)
        } else {
          // If user profile doesn't exist, create a basic one
          await setDoc(
            userDocRef,
            {
              fullName: user.displayName || "New User",
              email: user.email,
              gender: "prefer-not-to-say",
              createdAt: new Date(),
            },
            { merge: true },
          ) // Use merge to avoid overwriting existing fields
          setProfile({
            fullName: user.displayName || "New User",
            email: user.email || "",
            gender: "prefer-not-to-say",
          })
          toast({
            title: "Profile Created",
            description: "A basic profile has been created for you.",
          })
        }

        // Fetch wishlist items
        const wishlistQuery = query(collection(db, "wishlists"), where("userId", "==", user.uid))
        const wishlistSnapshot = await getDocs(wishlistQuery)
        const wishlistProductIds = wishlistSnapshot.docs.map((doc) => doc.data().productId)

        let fetchedWishlistProducts: Product[] = []
        if (wishlistProductIds.length > 0) {
          // Fetch products in batches if many to avoid query limits
          const productsQuery = query(collection(db, "products"))
          const productsSnapshot = await getDocs(productsQuery)
          const allProductsMap = new Map<string, Product>()
          productsSnapshot.docs.forEach((doc) => allProductsMap.set(doc.id, { id: doc.id, ...doc.data() } as Product))

          fetchedWishlistProducts = wishlistProductIds
            .map((id) => allProductsMap.get(id))
            .filter((product): product is Product => product !== undefined)
        }
        setWishlistItems(fetchedWishlistProducts)

        // Fetch purchase history
        const ordersQuery = query(collection(db, "orders"), where("userId", "==", user.uid))
        const ordersSnapshot = await getDocs(ordersQuery)
        const orders = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPurchaseHistory(orders)
      } catch (error: any) {
        console.error("Error fetching user data:", error)
        setDataError(error.message || "Failed to load user data. Check Firebase rules.")
        toast({
          title: "Data Load Error",
          description: error.message || "Failed to load dashboard data. Check Firebase Security Rules.",
          variant: "destructive",
        })
      } finally {
        setDataLoading(false)
      }
    }

    fetchUserData()
  }, [user, isFirebaseAvailable, toast]) // Depend on isFirebaseAvailable

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile || !isFirebaseAvailable || !checkFirebaseInitialized) {
      toast({
        title: "Error",
        description: "Firebase is not available or user not logged in.",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      await updateDoc(doc(db, "users", user.uid), {
        fullName: profile.fullName,
        gender: profile.gender,
        address: profile.address || null, // Ensure address is saved
      })

      if (newPassword) {
        await updatePassword(user, newPassword)
        setNewPassword("")
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>
  }

  if (!user) {
    return null // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="mb-6 space-y-4">
          <FirebaseStatus />
          <CloudinaryStatus />
        </div>

        {dataError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTitle>Data Error</AlertTitle>
            <div className="text-red-800">
              <strong>{dataError}</strong>
            </div>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your profile information and password</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div>Loading profile...</div>
                ) : profile ? (
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profile.fullName}
                          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                          disabled={!isFirebaseAvailable}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={profile.email} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Home Address</Label>
                      <Textarea
                        id="address"
                        value={profile.address || ""}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Enter your home address"
                        disabled={!isFirebaseAvailable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password (optional)</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        disabled={!isFirebaseAvailable}
                      />
                    </div>
                    <Button type="submit" disabled={updating || !isFirebaseAvailable}>
                      {updating ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                ) : (
                  <p className="text-gray-600">Profile data could not be loaded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>View your past orders and purchases</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div>Loading purchase history...</div>
                ) : purchaseHistory.length > 0 ? (
                  <div className="space-y-4">
                    {purchaseHistory.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-bold">${order.total}</p>
                        </div>
                        {/* You might want to display order items here */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No purchase history found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationSection />
          </TabsContent>

          <TabsContent value="wishlist">
            <Card>
              <CardHeader>
                <CardTitle>Your Wishlist</CardTitle>
                <CardDescription>Items you've saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div>Loading wishlist...</div>
                ) : wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Your wishlist is empty.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
