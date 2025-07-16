import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Test the Gemini API key with a simple request
    const { GoogleGenerativeAI } = await import("@google/generative-ai")

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const result = await model.generateContent("Hello, this is a test. Please respond with 'API key is working'.")
    const response = await result.response
    const text = response.text()

    if (text) {
      return NextResponse.json({
        success: true,
        message: "API key is valid and working",
        response: text,
      })
    } else {
      return NextResponse.json({ error: "Empty response from Gemini API" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Gemini API test error:", error)

    let errorMessage = "Failed to validate API key"

    if (error.message?.includes("API_KEY_INVALID")) {
      errorMessage = "Invalid API key. Please check your Gemini API key."
    } else if (error.message?.includes("insufficient permissions")) {
      errorMessage = "API key has insufficient permissions. Please check your API key settings."
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded. Please check your usage limits."
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
