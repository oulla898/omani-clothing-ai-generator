-- Update User Credits - Admin Tool
-- Replace 'USER_ID_HERE' with the actual Clerk user ID
-- Replace 'NEW_CREDIT_AMOUNT' with desired credits

-- Method 1: Set exact credit amount
UPDATE user_credits 
SET credits = 50  -- Change this number
WHERE user_id = 'user_2xyz123abc';  -- Replace with actual user ID

-- Method 2: Add credits to existing balance
UPDATE user_credits 
SET credits = credits + 25  -- Add 25 credits
WHERE user_id = 'user_2xyz123abc';  -- Replace with actual user ID

-- Method 3: Update multiple users at once
UPDATE user_credits 
SET credits = 20 
WHERE user_id IN (
    'user_2xyz123abc',
    'user_2def456ghi',
    'user_2jkl789mno'
);

-- Method 4: Give credits to all users (be careful!)
UPDATE user_credits 
SET credits = credits + 10;

-- Check user's current credits
SELECT user_id, credits, created_at, updated_at 
FROM user_credits 
WHERE user_id = 'user_2xyz123abc';

-- View all users and their credits
SELECT user_id, credits, created_at, updated_at 
FROM user_credits 
ORDER BY updated_at DESC;
