-- SUPABASE CLEANUP AND RESET SCRIPT
-- Run this BEFORE running setup.sql to ensure a clean database state

-- 1. Drop existing tables if they exist (from previous implementations)
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS generations CASCADE;
DROP TABLE IF EXISTS user_generations CASCADE;
DROP TABLE IF EXISTS credits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 3. Drop existing policies (they will be dropped with tables, but just in case)
-- Note: Policies are automatically dropped when tables are dropped

-- 4. Drop existing indexes (they will be dropped with tables, but for completeness)
-- Note: Indexes are automatically dropped when tables are dropped

-- 5. Clean up any existing RLS policies on auth.users (if any custom ones were added)
-- Note: Be careful not to break Supabase's built-in auth policies

-- 6. Reset sequences if any were created
-- Note: Sequences are automatically dropped when tables are dropped

-- 7. Clear any existing data from auth.users if needed (OPTIONAL - only if you want to reset all users)
-- WARNING: This will delete all user accounts! Only run if you want a complete reset
-- DELETE FROM auth.users;

-- Cleanup completed - you can now run setup.sql
SELECT 'Database cleanup completed successfully. Ready for setup.sql' as cleanup_status;
