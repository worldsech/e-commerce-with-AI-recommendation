"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FirebaseStatus {
  configured: boolean
  error: string | null
  missingVars: string[]
}

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export function FirebaseStatus() {
  const [status, setStatus] = useState<FirebaseStatus>({
    configured: false,
    error: null,
    missingVars: [],
  })
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  })
  const [isApplying, setIsApplying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkFirebaseConfig()
  }, [])

  const checkFirebaseConfig = () => {
    const requiredVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ]

    const missingVars = requiredVars.filter((varName) => !process.env[varName])

    if (missingVars.length > 0) {
      setStatus({
        configured: false,
        error: "Missing Firebase environment variables",
        missingVars,
      })
    } else {
      setStatus({
        configured: true,
        error: null,
        missingVars: [],
      })
    }
  }

  const handleConfigChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const applyConfiguration = async () => {
    setIsApplying(true)

    try {
      // Validate configuration
      const requiredFields = Object.entries(config)
      const emptyFields = requiredFields.filter(([_, value]) => !value.trim())

      if (emptyFields.length > 0) {
        toast({
          title: "Configuration Error",
          description: `Please fill in all fields. Missing: ${emptyFields.map(([key]) => key).join(", ")}`,
          variant: "destructive",
        })
        return
      }

      // Apply configuration by setting environment variables dynamically
      if (typeof window !== "undefined") {
        // Store in sessionStorage for this session
        sessionStorage.setItem("firebase_config", JSON.stringify(config))

        // Update process.env for this session (client-side only)
        Object.assign(process.env, {
          NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket,
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
          NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
        })
      }

      toast({
        title: "Configuration Applied",
        description: "Firebase configuration has been applied. Refreshing the page...",
      })

      // Refresh the page to reinitialize Firebase with new config
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to apply configuration. Please check your values.",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const loadSampleConfig = () => {
    setConfig({
      apiKey: "AIzaSyExample-your-api-key-here",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef123456",
    })
  }

  // Check if we have stored config from previous session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConfig = sessionStorage.getItem("firebase_config")
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig)
          setConfig(parsedConfig)
        } catch (error) {
          console.error("Error parsing stored config:", error)
        }
      }
    }
  }, [])

  if (status.configured) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 flex items-center justify-between">
          <span>Firebase is properly configured and ready to use.</span>
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)} className="ml-4">
            <Settings className="h-4 w-4 mr-2" />
            Reconfigure
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Firebase Configuration Required
        </CardTitle>
        <CardDescription className="text-orange-700">
          Configure Firebase to enable full e-commerce functionality including authentication, database, and AI
          recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Setup</TabsTrigger>
            <TabsTrigger value="manual">Manual Config</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing environment variables:</strong>
                <ul className="list-disc list-inside mt-2">
                  {status.missingVars.map((varName) => (
                    <li key={varName} className="font-mono text-sm">
                      {varName}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold">Quick Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Firebase Console
                  </a>
                </li>
                <li>Create a new project or select an existing one</li>
                <li>Enable Authentication and Firestore Database</li>
                <li>Go to Project Settings → General → Your apps</li>
                <li>Copy the Firebase config values</li>
                <li>Use the "Manual Config" tab to enter them below</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Firebase Configuration</h4>
                <Button variant="outline" size="sm" onClick={loadSampleConfig}>
                  Load Sample Format
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    placeholder="AIzaSyExample..."
                    value={config.apiKey}
                    onChange={(e) => handleConfigChange("apiKey", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authDomain">Auth Domain</Label>
                  <Input
                    id="authDomain"
                    placeholder="your-project.firebaseapp.com"
                    value={config.authDomain}
                    onChange={(e) => handleConfigChange("authDomain", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    placeholder="your-project-id"
                    value={config.projectId}
                    onChange={(e) => handleConfigChange("projectId", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageBucket">Storage Bucket</Label>
                  <Input
                    id="storageBucket"
                    placeholder="your-project.appspot.com"
                    value={config.storageBucket}
                    onChange={(e) => handleConfigChange("storageBucket", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
                  <Input
                    id="messagingSenderId"
                    placeholder="123456789012"
                    value={config.messagingSenderId}
                    onChange={(e) => handleConfigChange("messagingSenderId", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appId">App ID</Label>
                  <Input
                    id="appId"
                    placeholder="1:123456789012:web:abcdef123456"
                    value={config.appId}
                    onChange={(e) => handleConfigChange("appId", e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={applyConfiguration} className="w-full" disabled={isApplying}>
                {isApplying ? "Applying Configuration..." : "Apply Configuration & Reload"}
              </Button>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Note:</strong> This configuration will be stored for this browser session only. For permanent
                  setup, add these values to your environment variables.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
