-- COMPLETE Database Setup & Debug Script
-- Run this in Supabase SQL Editor step by step

-- Step 1: Check if tables exist at all
SELECT 'Tables that exist:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_credits', 'credit_transactions');

-- Step 2: If tables exist, show their structure
SELECT 'Table structures:' as info;
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_credits', 'credit_transactions')
ORDER BY table_name, ordinal_position;

-- Step 3: Show existing data (if any)
SELECT 'Existing data:' as info;
-- Only run if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_credits') THEN
        RAISE NOTICE 'user_credits table exists, showing data...';
    ELSE
        RAISE NOTICE 'user_credits table does not exist';
    END IF;
END $$;

-- Step 4: Create email-based tables (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(20) CHECK (type IN ('deduct', 'add', 'initial')) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_email ON user_credits(user_email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_email ON credit_transactions(user_email);

-- Step 6: Enable RLS and create policies  
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow all operations on user_credits" ON user_credits;
DROP POLICY IF EXISTS "Allow all operations on credit_transactions" ON credit_transactions;

-- Create permissive policies
CREATE POLICY "Allow all operations on user_credits" ON user_credits FOR ALL USING (true);
CREATE POLICY "Allow all operations on credit_transactions" ON credit_transactions FOR ALL USING (true);

-- Step 7: Verify final setup
SELECT 'Final verification:' as info;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_credits', 'credit_transactions')
ORDER BY table_name, ordinal_position;

-- Step 8: Show current data counts
SELECT 'Data counts:' as info;
SELECT 'user_credits' as table_name, COUNT(*) as records FROM user_credits
UNION ALL
SELECT 'credit_transactions' as table_name, COUNT(*) as records FROM credit_transactions;
