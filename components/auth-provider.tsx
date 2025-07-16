"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { checkFirebaseConfig } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isFirebaseAvailable: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isFirebaseAvailable: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        const config = checkFirebaseConfig()
        setIsFirebaseAvailable(config.isFirebaseAvailable)

        if (!config.isFirebaseAvailable) {
          setError(config.isProperlyConfigured ? "Firebase initialization failed" : "Firebase not configured")
          setLoading(false)
          return
        }

        // Only try to set up auth if Firebase is available
        const { auth } = await import("@/lib/firebase")
        const { onAuthStateChanged } = await import("firebase/auth")

        if (auth) {
          unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
              setUser(user)
              setLoading(false)
              setError(null)
            },
            (error) => {
              console.error("Auth state change error:", error)
              setError("Authentication error occurred")
              setLoading(false)
            },
          )
        } else {
          setError("Firebase Auth not available")
          setLoading(false)
        }
      } catch (error) {
        console.error("Firebase initialization error:", error)
        setError("Failed to initialize authentication")
        setIsFirebaseAvailable(false)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, error, isFirebaseAvailable }}>{children}</AuthContext.Provider>
}
