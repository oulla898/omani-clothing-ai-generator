-- Database Migration Script: Convert from user_id to user_email
-- Run this in Supabase SQL Editor to migrate to email-based system

-- Step 1: First, let's see what we currently have
SELECT * FROM user_credits ORDER BY created_at;
SELECT * FROM credit_transactions ORDER BY created_at;

-- Step 2: Create new tables with email-based structure
-- (Run the updated database-schema.sql first)

-- Step 3: If you have existing data, you'll need to manually map user_id to email
-- This requires you to have a mapping of Clerk user IDs to emails
-- Since we don't have that mapping, it's easier to start fresh

-- Step 4: Clear existing data (CAREFUL - this deletes all current data)
-- TRUNCATE TABLE credit_transactions;
-- TRUNCATE TABLE user_credits;

-- Step 5: Drop old tables and recreate with new schema
-- DROP TABLE IF EXISTS user_credits;
-- DROP TABLE IF EXISTS credit_transactions;

-- Then run the new database-schema.sql to create the email-based tables

-- Note: Since this is a breaking change, existing users will get fresh 10 credits
-- when they log in again. This is acceptable for a new system.
