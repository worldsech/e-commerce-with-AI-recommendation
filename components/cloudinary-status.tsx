"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CloudinaryStatus {
  configured: boolean
  error: string | null
}

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export function CloudinaryStatus() {
  const [status, setStatus] = useState<CloudinaryStatus>({
    configured: false,
    error: null,
  })
  const [config, setConfig] = useState<CloudinaryConfig>({
    cloudName: "",
    apiKey: "",
    apiSecret: "",
  })
  const [isApplying, setIsApplying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkCloudinaryConfig()
  }, [])

  const checkCloudinaryConfig = () => {
    const hasCloudName =
      !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== "your_cloud_name"
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== "your_api_key"
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET !== "your_api_secret"

    if (hasCloudName && hasApiKey && hasApiSecret) {
      setStatus({ configured: true, error: null })
    } else {
      setStatus({
        configured: false,
        error: "Missing Cloudinary environment variables",
      })
    }
  }

  const handleConfigChange = (field: keyof CloudinaryConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const applyConfiguration = () => {
    setIsApplying(true)
    try {
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

      if (typeof window !== "undefined") {
        sessionStorage.setItem("cloudinary_config", JSON.stringify(config))
        Object.assign(process.env, {
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: config.cloudName,
          CLOUDINARY_API_KEY: config.apiKey,
          CLOUDINARY_API_SECRET: config.apiSecret,
        })
      }

      toast({
        title: "Configuration Applied",
        description: "Cloudinary configuration has been applied. Refreshing the page...",
      })

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
      cloudName: "your_cloud_name",
      apiKey: "your_api_key",
      apiSecret: "your_api_secret",
    })
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConfig = sessionStorage.getItem("cloudinary_config")
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
        <AlertDescription className="text-green-800">
          Cloudinary is properly configured for image management.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Cloudinary Configuration Required
        </CardTitle>
        <CardDescription className="text-orange-700">
          Configure Cloudinary to enable image storage and management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Status:</strong> {status.error || "Cloudinary not configured"}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Quick Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://cloudinary.com/console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Cloudinary Console <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Sign up or log in</li>
              <li>Copy your Cloud Name, API Key, and API Secret from the Dashboard</li>
              <li>Paste them below and click "Apply Configuration"</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloudName">Cloud Name</Label>
            <Input
              id="cloudName"
              placeholder="your_cloud_name"
              value={config.cloudName}
              onChange={(e) => handleConfigChange("cloudName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              placeholder="your_api_key"
              value={config.apiKey}
              onChange={(e) => handleConfigChange("apiKey", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="your_api_secret"
              value={config.apiSecret}
              onChange={(e) => handleConfigChange("apiSecret", e.target.value)}
            />
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
      </CardContent>
    </Card>
  )
}
