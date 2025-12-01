-- Create credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    amount INTEGER NOT NULL,
    payment_method TEXT,
    payment_amount DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Add RLS policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Only service role can insert transactions
CREATE POLICY "Service role can manage transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data to verify table works
-- INSERT INTO credit_transactions (user_id, type, amount, payment_method, payment_amount, description)
-- VALUES ('sample_user_id', 'purchase', 20, 'whatsapp_bank_transfer', 2.0, 'Initial credit purchase via WhatsApp');
