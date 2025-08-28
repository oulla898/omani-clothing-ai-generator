# Supabase Database Reset Guide

## Why Reset?
If you had previous implementations or test data, it's best to start fresh to avoid conflicts with the new credit system.

## Step-by-Step Reset Process

### 1. Backup Important Data (Optional)
If you have any important data you want to keep:
```sql
-- Export existing data first (if needed)
SELECT * FROM your_important_table;
```

### 2. Run Cleanup Script
Go to your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Copy and paste the contents of `database/cleanup.sql`
3. Click **Run**

This will:
- Drop all existing tables that might conflict
- Remove old functions and triggers
- Clear old indexes and policies

### 3. Run Setup Script
After cleanup is complete:
1. Stay in **SQL Editor**
2. Copy and paste the contents of `database/setup.sql`
3. Click **Run**

This will create:
- Fresh `user_credits` table
- Proper RLS policies
- Required indexes and triggers

### 4. Verify Setup
Check that everything was created correctly:
```sql
-- Check table structure
\d user_credits;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_credits';

-- Check if table is empty (should be)
SELECT COUNT(*) FROM user_credits;
```

## What Gets Reset

### ✅ Will Be Cleaned Up:
- All existing tables related to credits/generations
- Old database functions
- Existing RLS policies
- Previous indexes
- Any test data

### ❌ Will NOT Be Affected:
- Supabase auth.users table (user accounts remain)
- Your environment variables
- Your application code
- Supabase project settings

## After Reset

### Test the New System:
1. Deploy your updated code to Vercel
2. Sign in with a test account
3. Verify you see "10" credits in the header
4. Generate an image to test credit deduction
5. Check the database to see the credit record

### Check Database:
```sql
-- View all user credits
SELECT user_id, credits, created_at, updated_at 
FROM user_credits 
ORDER BY created_at DESC;

-- Count total users with credits
SELECT COUNT(*) as total_users FROM user_credits;
```

## Troubleshooting

### If Cleanup Fails:
- Some DROP statements might fail if tables don't exist - this is normal
- Continue with the setup.sql script
- Check for any error messages and resolve conflicts

### If Setup Fails:
- Make sure cleanup ran successfully first
- Check for permission issues
- Verify you're running as the database owner
- Look for any naming conflicts

### If RLS Policies Don't Work:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_credits';

-- Re-enable RLS if needed
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
```

## Environment Variables Check

Make sure these are set in your Vercel deployment:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ygftqsvzxeroaovfdkvd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Final Verification

After everything is set up:
1. New users should automatically get 10 credits
2. Credit deduction should work properly
3. UI should show current credit balance
4. Generation should be blocked when credits reach 0

The reset ensures a clean, consistent database state for your credit system!
