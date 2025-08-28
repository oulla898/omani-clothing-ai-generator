# Vercel Deployment Guide

## Prerequisites

### 1. Database Setup (Supabase)
Before deploying, you need to set up the database tables. Run the SQL commands in `database-schema.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Execute the SQL to create the required tables and policies

### 2. Environment Variables Needed

Add these to your Vercel dashboard under Settings → Environment Variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Replicate AI
REPLICATE_API_TOKEN=your_replicate_token_here

# Supabase Database (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://ygftqsvzxeroaovfdkvd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZnRxc3Z6eGVyb2FvdmZka3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNjE4OTAsImV4cCI6MjA3MTkzNzg5MH0.-H63TDE19nacT__Q5e65AI_7lpOVsP-J31ZVcyLY8Ts
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZnRxc3Z6eGVyb2FvdmZka3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM2MTg5MCwiZXhwIjoyMDcxOTM3ODkwfQ.bmRcT3pZHSLD67mA6mDwIDSwpEeoNg-VzpuoYWhI_YA
```

## Deployment Steps:

1. **Set Up Database Tables**
   - Run the SQL in `database-schema.sql` in your Supabase SQL editor
   - This creates the `user_credits` and `credit_transactions` tables

2. **Import GitHub Repository** to Vercel
   - Repository: `oulla898/omani-clothing-ai-generator`

3. **Set Environment Variables** in Vercel Dashboard
   - Go to Settings → Environment Variables
   - Add each variable with the actual values
   - Set Environment to "Production, Preview, and Development"

4. **Deploy**
   - Vercel will automatically deploy on every push to main

## API Key Values:

**Contact the developer for the actual Clerk and Replicate API key values to use in Vercel.**

## New Features in This Version:

### ✅ Persistent Credit System
- **Database Integration**: Uses Supabase for credit storage
- **New User Bonus**: Automatic 10 credits for new signups
- **Credit Tracking**: Full transaction history and audit trail
- **Admin Management**: Real-time credit management via admin panel
- **Secure**: Row-level security policies protect user data

### ✅ Enhanced Admin Panel
- **Real User Data**: Displays actual users from database
- **Credit Management**: Add/deduct credits for any user
- **Transaction History**: View all credit transactions
- **Usage Statistics**: Real-time analytics

The application includes:
✅ AI Image Generation for Omani Traditional Clothing  
✅ Clerk Authentication System
✅ **NEW: Persistent Credit System with Database**
✅ **NEW: Credit Transaction History**
✅ Enhanced Admin Panel at `/admin-panel-omani-2024`
✅ Responsive Design
✅ Production-ready configuration
