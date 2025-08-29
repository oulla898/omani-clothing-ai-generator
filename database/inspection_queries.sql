-- SUPABASE USER ACCOUNTS AND CREDITS INSPECTION QUERIES
-- Run these queries in your Supabase SQL Editor to check account details

-- 1. VIEW ALL USER CREDITS WITH BASIC INFO
SELECT 
    uc.user_id,
    uc.credits,
    uc.created_at as credit_account_created,
    uc.updated_at as last_credit_update
FROM user_credits uc
ORDER BY uc.created_at DESC;

-- 2. COUNT TOTAL USERS WITH CREDITS
SELECT 
    COUNT(*) as total_users_with_credits,
    AVG(credits) as average_credits,
    SUM(credits) as total_credits_in_system,
    MIN(credits) as min_credits,
    MAX(credits) as max_credits
FROM user_credits;

-- 3. USERS BY CREDIT LEVELS
SELECT 
    credits,
    COUNT(*) as user_count
FROM user_credits
GROUP BY credits
ORDER BY credits DESC;

-- 4. USERS WITH LOW CREDITS (potential customers)
SELECT 
    user_id,
    credits,
    created_at,
    updated_at
FROM user_credits
WHERE credits <= 2
ORDER BY credits ASC, updated_at DESC;

-- 5. USERS WITH NO CREDITS (need refill)
SELECT 
    user_id,
    credits,
    created_at,
    updated_at
FROM user_credits
WHERE credits = 0
ORDER BY updated_at DESC;

-- 6. NEW USERS TODAY
SELECT 
    COUNT(*) as new_users_today
FROM user_credits
WHERE created_at::date = CURRENT_DATE;

-- 7. RECENT ACTIVITY (users who used credits recently)
SELECT 
    user_id,
    credits,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_last_activity
FROM user_credits
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- 8. USERS BY REGISTRATION DATE
SELECT 
    DATE(created_at) as registration_date,
    COUNT(*) as users_registered
FROM user_credits
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;

-- 9. CREDIT USAGE ANALYSIS (estimated)
-- This estimates how many credits users have consumed based on starting with 10
SELECT 
    user_id,
    credits as current_credits,
    (10 - credits) as estimated_credits_used,
    CASE 
        WHEN credits = 10 THEN 'No usage yet'
        WHEN credits > 5 THEN 'Light usage'
        WHEN credits > 0 THEN 'Heavy usage'
        ELSE 'No credits left'
    END as usage_category,
    created_at,
    updated_at
FROM user_credits
ORDER BY estimated_credits_used DESC;

-- 10. DETAILED USER STATISTICS
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM user_credits
UNION ALL
SELECT 
    'Users with Credits',
    COUNT(*)::text
FROM user_credits
WHERE credits > 0
UNION ALL
SELECT 
    'Users with No Credits',
    COUNT(*)::text
FROM user_credits
WHERE credits = 0
UNION ALL
SELECT 
    'Average Credits per User',
    ROUND(AVG(credits), 2)::text
FROM user_credits
UNION ALL
SELECT 
    'Total Credits in System',
    SUM(credits)::text
FROM user_credits
UNION ALL
SELECT 
    'New Users Last 7 Days',
    COUNT(*)::text
FROM user_credits
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Active Users Last 24h',
    COUNT(*)::text
FROM user_credits
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- 11. IF YOU WANT TO CHECK AUTH.USERS TABLE (Clerk user details)
-- Note: This requires proper permissions and shows Supabase auth users
-- Uncomment if you want to see full user profiles
/*
SELECT 
    au.id as auth_user_id,
    au.email,
    au.created_at as auth_created,
    au.last_sign_in_at,
    uc.credits,
    uc.created_at as credit_account_created,
    uc.updated_at as last_credit_update
FROM auth.users au
LEFT JOIN user_credits uc ON au.id = uc.user_id
ORDER BY au.created_at DESC;
*/

-- 12. FIND SPECIFIC USER BY PARTIAL USER_ID
-- Replace 'user_xxx' with partial user ID you're looking for
/*
SELECT 
    user_id,
    credits,
    created_at,
    updated_at
FROM user_credits
WHERE user_id LIKE '%user_xxx%';
*/

-- 13. CHECK TABLE STRUCTURE AND CONSTRAINTS
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_credits'
ORDER BY ordinal_position;

-- 14. CHECK RLS POLICIES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_credits';

-- 15. CHECK INDEXES
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_credits';

-- =============================================================================
-- IMAGE STORAGE SYSTEM QUERIES (for user_generations table)
-- =============================================================================

-- 16. VIEW ALL USER GENERATIONS WITH DETAILS
SELECT 
    ug.id,
    ug.user_id,
    ug.prompt,
    ug.image_url,
    ug.created_at,
    uc.credits as user_current_credits
FROM user_generations ug
LEFT JOIN user_credits uc ON ug.user_id = uc.user_id
ORDER BY ug.created_at DESC;

-- 17. GENERATION STATISTICS BY USER
SELECT 
    uc.user_id,
    uc.credits,
    COUNT(ug.id) as total_generations,
    MAX(ug.created_at) as latest_generation,
    MIN(ug.created_at) as first_generation
FROM user_credits uc
LEFT JOIN user_generations ug ON uc.user_id = ug.user_id
GROUP BY uc.user_id, uc.credits
ORDER BY total_generations DESC;

-- 18. MOST ACTIVE USERS (by generations)
SELECT 
    user_id,
    COUNT(*) as generation_count,
    MAX(created_at) as last_generation
FROM user_generations
GROUP BY user_id
ORDER BY generation_count DESC
LIMIT 10;

-- 19. POPULAR PROMPTS ANALYSIS
SELECT 
    LEFT(prompt, 50) as prompt_preview,
    COUNT(*) as usage_count
FROM user_generations
GROUP BY LEFT(prompt, 50)
ORDER BY usage_count DESC
LIMIT 20;

-- 20. DAILY GENERATION ACTIVITY
SELECT 
    DATE(created_at) as generation_date,
    COUNT(*) as generations_count,
    COUNT(DISTINCT user_id) as unique_users
FROM user_generations
GROUP BY DATE(created_at)
ORDER BY generation_date DESC;

-- 21. USER ENGAGEMENT ANALYSIS
SELECT 
    'Total Generations' as metric,
    COUNT(*)::text as value
FROM user_generations
UNION ALL
SELECT 
    'Users with Generations',
    COUNT(DISTINCT user_id)::text
FROM user_generations
UNION ALL
SELECT 
    'Average Generations per User',
    ROUND(AVG(generation_count), 2)::text
FROM (
    SELECT COUNT(*) as generation_count 
    FROM user_generations 
    GROUP BY user_id
) subquery
UNION ALL
SELECT 
    'Generations Last 24h',
    COUNT(*)::text
FROM user_generations
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'Generations Last 7 Days',
    COUNT(*)::text
FROM user_generations
WHERE created_at > NOW() - INTERVAL '7 days';

-- 22. STORAGE USAGE ESTIMATE
SELECT 
    COUNT(*) as total_images,
    COUNT(*) * 0.5 as estimated_storage_mb, -- Assuming ~500KB per image
    ROUND(COUNT(*) * 0.5 / 1024, 2) as estimated_storage_gb
FROM user_generations;

-- 23. FIND SPECIFIC USER'S GENERATIONS
-- Replace 'user_xxx' with the user ID you're looking for
/*
SELECT 
    id,
    prompt,
    image_url,
    created_at
FROM user_generations
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC;
*/

-- 24. RECENT GENERATIONS WITH USER CREDIT INFO
SELECT 
    ug.prompt,
    ug.created_at,
    uc.credits as remaining_credits,
    EXTRACT(EPOCH FROM (NOW() - ug.created_at))/3600 as hours_ago
FROM user_generations ug
JOIN user_credits uc ON ug.user_id = uc.user_id
WHERE ug.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ug.created_at DESC;

-- 25. CHECK IMAGE STORAGE TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_generations'
ORDER BY ordinal_position;
