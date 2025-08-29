-- DEBUG QUERIES FOR IMAGE STORAGE ISSUES
-- Run these in Supabase SQL Editor to diagnose problems

-- 1. CHECK IF user_generations TABLE EXISTS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_generations'
ORDER BY ordinal_position;

-- 2. CHECK IF ANY RECORDS EXIST AT ALL
SELECT COUNT(*) as total_records FROM user_generations;

-- 3. CHECK RLS POLICIES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_generations';

-- 4. CHECK YOUR SPECIFIC USER RECORDS (replace 'your_user_id' with actual ID)
-- First find your user_id from credits table:
SELECT user_id, credits FROM user_credits LIMIT 5;

-- Then check generations for your user:
-- SELECT * FROM user_generations WHERE user_id = 'your_actual_user_id';

-- 5. TEST INSERT PERMISSIONS (replace with your actual user_id)
-- INSERT INTO user_generations (user_id, prompt, image_url) 
-- VALUES ('your_user_id', 'test prompt', 'https://test.com/image.jpg');

-- 6. CHECK IF FOREIGN KEY CONSTRAINT IS WORKING
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'user_generations';

-- 7. CHECK RECENT ACTIVITY (if any)
SELECT * FROM user_generations 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
