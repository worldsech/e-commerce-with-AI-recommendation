import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if we're in development and have minimal config for demo mode
const isDevelopment = process.env.NODE_ENV === "development"

// Function to get config from session storage (client-side only)
const getSessionConfig = () => {
  if (typeof window !== "undefined") {
    const storedConfig = sessionStorage.getItem("firebase_config")
    if (storedConfig) {
      try {
        return JSON.parse(storedConfig)
      } catch (error) {
        console.error("Error parsing stored config:", error)
      }
    }
  }
  return null
}

// Default demo configuration for development
const defaultConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo",
}

// Get session config if available
const sessionConfig = getSessionConfig()

// Use session config, then environment variables, then demo config
const firebaseConfig = sessionConfig || {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (isDevelopment ? defaultConfig.apiKey : ""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (isDevelopment ? defaultConfig.authDomain : ""),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (isDevelopment ? defaultConfig.projectId : ""),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (isDevelopment ? defaultConfig.storageBucket : ""),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || (isDevelopment ? defaultConfig.messagingSenderId : ""),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (isDevelopment ? defaultConfig.appId : ""),
}

// Check if configuration is valid (not demo config)
const isConfigValid =
  Object.values(firebaseConfig).every((value) => value && value !== "") &&
  firebaseConfig.apiKey !== defaultConfig.apiKey

let app: any = null
let auth: any = null
let db: any = null
let storage: any = null
let isFirebaseAvailable = false

if (isConfigValid) {
  try {
    // Initialize Firebase only if not already initialized
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

    // Only initialize services if we have a valid app
    if (app) {
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
      isFirebaseAvailable = true

      console.log("Firebase initialized successfully with", sessionConfig ? "session config" : "environment variables")
    }
  } catch (error) {
    console.warn("Firebase initialization failed:", error)
    isFirebaseAvailable = false
  }
}

// Export a flag to check if Firebase is available
export { auth, db, storage, isFirebaseAvailable }

// Helper function to check if Firebase is properly configured
export const checkFirebaseConfig = () => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  const missingVars = requiredVars.filter((varName) => !process.env[varName])
  const hasSessionConfig = getSessionConfig() !== null
  const isProperlyConfigured = missingVars.length === 0 || hasSessionConfig

  return {
    isProperlyConfigured,
    missingVars,
    isFirebaseAvailable,
    hasSessionConfig,
  }
}
