-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    credits INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow the service to update credits
CREATE POLICY "Service can update user credits" ON user_credits
    FOR ALL USING (true);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE
    ON user_credits FOR EACH ROW EXECUTE FUNCTION
    update_updated_at_column();
