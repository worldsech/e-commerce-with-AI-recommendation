"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GeminiStatus {
  configured: boolean
  error: string | null
  isValid: boolean
}

export function GeminiStatus() {
  const [status, setStatus] = useState<GeminiStatus>({
    configured: false,
    error: null,
    isValid: false,
  })
  const [apiKey, setApiKey] = useState("")
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkGeminiConfig()
  }, [])

  const checkGeminiConfig = () => {
    const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"

    setStatus({
      configured: hasApiKey,
      error: hasApiKey ? null : "Gemini API key not configured",
      isValid: hasApiKey,
    })
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to test.",
        variant: "destructive",
      })
      return
    }

    setTesting(true)

    try {
      // Test the API key by making a simple request
      const response = await fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (response.ok) {
        // Store the API key temporarily
        if (typeof window !== "undefined") {
          sessionStorage.setItem("gemini_api_key", apiKey.trim())
          Object.assign(process.env, {
            GEMINI_API_KEY: apiKey.trim(),
          })
        }

        toast({
          title: "API Key Valid",
          description: "Gemini API key is working correctly!",
        })

        setStatus({
          configured: true,
          error: null,
          isValid: true,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "API key validation failed")
      }
    } catch (error: any) {
      toast({
        title: "API Key Invalid",
        description: error.message || "Failed to validate API key.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (status.configured && status.isValid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Gemini AI is properly configured and ready for recommendations.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Gemini AI Configuration
        </CardTitle>
        <CardDescription className="text-orange-700">
          Configure Gemini AI to enable intelligent product recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Status:</strong> {status.error || "API key not configured"}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Quick Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Go to{" "}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Create a new API key</li>
              <li>Copy the API key and paste it below</li>
              <li>Click "Test & Apply" to validate</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geminiApiKey">Gemini API Key</Label>
            <div className="flex gap-2">
              <Input
                id="geminiApiKey"
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testApiKey} disabled={testing || !apiKey.trim()}>
                {testing ? "Testing..." : "Test & Apply"}
              </Button>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Note:</strong> This API key will be stored for this browser session only. For permanent setup, add
              it to your environment variables as GEMINI_API_KEY.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}
