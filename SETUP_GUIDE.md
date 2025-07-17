# E-commerce Platform Setup Guide

This guide will help you set up all the necessary configurations for the e-commerce platform.

## 🔥 Firebase Setup (Required)

1.  **Create Firebase Project**
    -   Go to [Firebase Console](https://console.firebase.google.com)
    -   Click "Create a project"
    -   Follow the setup wizard

2.  **Enable Authentication**
    -   Go to Authentication > Sign-in method
    -   Enable "Email/Password" provider
    -   Optionally enable Google, Facebook, etc.

3.  **Enable Firestore Database**
    -   Go to Firestore Database
    -   Click "Create database"
    -   Choose "Start in test mode" for development

4.  **Get Configuration**
    -   Go to Project Settings (gear icon)
    -   Scroll to "Your apps" section
    -   Click "Web app" icon to create/view web app
    -   Copy the config values to `.env.local`

## ☁️ Cloudinary Setup (Required for Images)

1.  **Create Cloudinary Account**
    -   Go to [Cloudinary](https://cloudinary.com)
    -   Sign up for free account

2.  **Get API Credentials**
    -   Go to Dashboard
    -   Copy Cloud Name, API Key, and API Secret
    -   Add to `.env.local`

3.  **Create Upload Preset**
    -   Go to Settings > Upload
    -   Create new upload preset named **`default`**
    -   **Crucially, set its "Mode" to "Unsigned"** for direct uploads.

## 🤖 Gemini AI Setup (Required for Recommendations)

1.  **Get API Key**
    -   Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
    -   Create new API key
    -   Add to `.env.local`

## 📋 Environment Variables Checklist

### Required Variables
-   [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
-   [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
-   [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
-   [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
-   [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
-   [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
-   [ ] `CLOUDINARY_CLOUD_NAME`
-   [ ] `CLOUDINARY_API_KEY`
-   [ ] `CLOUDINARY_API_SECRET`
-   [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
-   [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
-   [ ] `GEMINI_API_KEY`

### Optional Variables
-   [ ] Payment gateway credentials (Stripe, PayPal)
-   [ ] Email service credentials (SendGrid, SMTP)
-   [ ] Analytics IDs (Google Analytics, Facebook Pixel)
-   [ ] Additional security keys

## 🚀 Quick Start

1.  **Copy the template**
    \`\`\`bash
    cp .env.local.example .env.local
    \`\`\`

2.  **Fill in required values**
    -   Firebase configuration
    -   Cloudinary credentials
    -   Gemini API key

3.  **Start development server**
    \`\`\`bash
    npm run dev
    \`\`\`

4.  **Test the setup**
    -   Visit `http://localhost:3000`
    -   Try creating an account
    -   Test product recommendations

## 🔧 Troubleshooting

### Firebase Issues
-   Ensure all Firebase services are enabled
-   Check API key permissions
-   Verify domain is added to authorized domains

### Cloudinary Issues
-   Verify upload preset exists and is unsigned
-   Check API credentials are correct
-   Ensure cloud name matches exactly

### Gemini AI Issues
-   Verify API key is active
-   Check quota limits
-   Ensure Gemini API is enabled in Google Cloud

## 🛡️ Security Notes

-   Never commit `.env.local` to version control
-   Use different credentials for production
-   Enable Firebase security rules in production
-   Set up proper CORS policies

## 📞 Support

If you encounter issues:
1.  Check the browser console for errors
2.  Verify all environment variables are set
3.  Test each service individually
4.  Check service status pages for outages
