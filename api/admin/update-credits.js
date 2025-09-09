// Admin API to Update User Credits
// Create this as: /api/admin/update-credits.js

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, credits, action } = req.body;

        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        if (typeof credits !== 'number' || credits < 0) {
            return res.status(400).json({ error: 'Valid credit amount required' });
        }

        // Connect to your database
        const { supabase } = require('../../lib/supabase');

        let query;
        if (action === 'set') {
            // Set exact amount
            query = supabase
                .from('user_credits')
                .upsert({ 
                    user_id: userId, 
                    credits: credits 
                }, { 
                    onConflict: 'user_id' 
                });
        } else if (action === 'add') {
            // Add to existing credits
            const { data: currentUser } = await supabase
                .from('user_credits')
                .select('credits')
                .eq('user_id', userId)
                .single();

            const currentCredits = currentUser?.credits || 0;
            const newCredits = currentCredits + credits;

            query = supabase
                .from('user_credits')
                .upsert({ 
                    user_id: userId, 
                    credits: newCredits 
                }, { 
                    onConflict: 'user_id' 
                });
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        // Get updated credits
        const { data: updatedUser } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', userId)
            .single();

        res.status(200).json({
            success: true,
            userId,
            newCredits: updatedUser?.credits || 0,
            message: `Credits ${action === 'set' ? 'set to' : 'increased by'} ${credits}`
        });

    } catch (error) {
        console.error('Error updating credits:', error);
        res.status(500).json({ error: 'Failed to update credits' });
    }
}

// Usage Examples:
/*
// Set credits to exact amount
POST /api/admin/update-credits
{
    "userId": "user_2xyz123abc",
    "credits": 50,
    "action": "set"
}

// Add credits to existing balance
POST /api/admin/update-credits
{
    "userId": "user_2xyz123abc", 
    "credits": 25,
    "action": "add"
}
*/
