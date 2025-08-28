-- ADD IMAGE STORAGE TO EXISTING CREDIT SYSTEM
-- Run this AFTER setup.sql to add image history functionality

-- Create user_generations table to store generated images
CREATE TABLE IF NOT EXISTS user_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key reference to user_credits
    CONSTRAINT fk_user_generations_user_id 
        FOREIGN KEY (user_id) REFERENCES user_credits(user_id) ON DELETE CASCADE
);

-- Create index on user_id for fast lookups of user's images
CREATE INDEX IF NOT EXISTS idx_user_generations_user_id ON user_generations(user_id);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_user_generations_created_at ON user_generations(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own generations
CREATE POLICY "Users can view their own generations" ON user_generations
    FOR SELECT USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own generations
CREATE POLICY "Users can insert their own generations" ON user_generations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own generations (optional)
CREATE POLICY "Users can delete their own generations" ON user_generations
    FOR DELETE USING (auth.uid()::text = user_id);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_user_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_generations_updated_at BEFORE UPDATE
    ON user_generations FOR EACH ROW EXECUTE FUNCTION
    update_user_generations_updated_at();

-- Add some helpful views for analytics
CREATE OR REPLACE VIEW user_generation_stats AS
SELECT 
    uc.user_id,
    uc.credits,
    COUNT(ug.id) as total_generations,
    MAX(ug.created_at) as last_generation,
    MIN(ug.created_at) as first_generation
FROM user_credits uc
LEFT JOIN user_generations ug ON uc.user_id = ug.user_id
GROUP BY uc.user_id, uc.credits;

SELECT 'Image storage system setup completed successfully!' as setup_status;
