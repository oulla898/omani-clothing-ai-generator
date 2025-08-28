-- Database Cleanup Script for Duplicate Credit Records
-- Run this in Supabase SQL Editor to fix existing duplicates

-- Step 1: Check for duplicate user_id records
SELECT user_id, COUNT(*) as count
FROM user_credits 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Remove duplicates, keeping the record with the LOWEST credits (real usage)
WITH ranked_credits AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY credits ASC, created_at ASC) as rn
  FROM user_credits
)
DELETE FROM user_credits 
WHERE id IN (
  SELECT id FROM ranked_credits WHERE rn > 1
);

-- Step 3: Verify no duplicates remain
SELECT user_id, COUNT(*) as count
FROM user_credits 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 4: Check current credit balances
SELECT user_id, credits, created_at, updated_at 
FROM user_credits 
ORDER BY created_at DESC;
