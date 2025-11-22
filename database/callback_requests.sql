-- Create callback_requests table for users who want to be contacted
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact TEXT NOT NULL,
  notes TEXT,
  user_id TEXT NOT NULL,
  package_credits INTEGER,
  package_price DECIMAL(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_callback_requests_status ON callback_requests(status);
CREATE INDEX IF NOT EXISTS idx_callback_requests_created_at ON callback_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_callback_requests_user_id ON callback_requests(user_id);

-- Add RLS policies
ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything on callback_requests"
  ON callback_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE callback_requests IS 'Stores callback requests from users who want to be contacted for credit purchases';
