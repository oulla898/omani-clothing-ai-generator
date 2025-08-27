# Vercel Deployment Guide

## Environment Variables Needed:

Add these to your Vercel dashboard under Settings → Environment Variables:

```
REPLICATE_API_TOKEN=your_replicate_token_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here  
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## Deployment Steps:

1. **Import GitHub Repository** to Vercel
   - Repository: `oulla898/omani-clothing-ai-generator`

2. **Set Environment Variables** in Vercel Dashboard
   - Go to Settings → Environment Variables
   - Add each variable with the actual values
   - Set Environment to "Production, Preview, and Development"

3. **Deploy**
   - Vercel will automatically deploy on every push to master

## API Key Values:

**Contact the developer for the actual API key values to use in Vercel.**

The application includes:
✅ AI Image Generation for Omani Traditional Clothing  
✅ Clerk Authentication System
✅ Credit System (10 credits per user)
✅ Admin Panel at `/admin-panel-omani-2024`
✅ Responsive Design
✅ Production-ready configuration
