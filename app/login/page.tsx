"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { FirebaseStatus } from "@/components/firebase-status"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const { auth, isFirebaseAvailable } = await import("@/lib/firebase")

      if (!isFirebaseAvailable || !auth) {
        throw new Error("Firebase is not properly configured or initialized.")
      }

      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Login failed. Please try again."

      if (error.code === "auth/network-request-failed") {
        errorMessage =
          "Network error: Could not connect to Firebase. Check your internet connection, browser extensions, or Firebase configuration (Auth Domain)."
      } else if (
        error.code === "auth/invalid-api-key" ||
        error.message.includes("Firebase is not properly configured")
      ) {
        errorMessage = "Firebase is not properly configured. Please configure Firebase first."
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Incorrect password or invalid credentials."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/Password sign-in is not enabled in your Firebase project."
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <FirebaseStatus />

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {"Don't have an account? "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Test Account (after Firebase setup):</strong>
                  <br />
                  Create an account through the signup form
                  <br />
                  Or configure Firebase to enable authentication
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
