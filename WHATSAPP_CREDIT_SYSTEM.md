# WhatsApp Credit Purchase System Setup

## Overview
This system allows Omani customers to purchase credits through WhatsApp messages and bank transfers, avoiding online payment fees and building trust through direct communication.

## Payment Flow
1. **Customer Request**: User clicks "Buy Credits" → WhatsApp opens with pre-filled message
2. **Bank Transfer**: Customer transfers money to Bank Muscat account: `96841234567` (AL MAALA AL MAAWALI)
3. **Receipt Verification**: Customer sends transfer receipt via WhatsApp
4. **Manual Credit Addition**: Admin verifies payment and adds credits via admin panel
5. **Confirmation**: Admin confirms credit addition to customer via WhatsApp

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Admin Secret Key for credit management
ADMIN_SECRET_KEY=your_super_secret_admin_key_here

# Supabase Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Bank Account Details (for customer reference)
BANK_ACCOUNT_NUMBER=96841234567
BANK_ACCOUNT_HOLDER=AL MAALA AL MAAWALI
BANK_NAME=Bank Muscat
```

## Database Setup

1. Run the credit transactions table setup:
```sql
-- Execute this in your Supabase SQL editor
-- File: database/credit_transactions.sql
```

2. Verify the users table has credits column:
```sql
-- Should already exist from previous setup
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
```

## Admin Panel Access

1. **URL**: `https://yourdomain.com/admin.html`
2. **Admin Key**: Use the secret key from your environment variables
3. **Security**: Only share admin access with trusted team members

## Credit Pricing Structure

- **Starter**: 20 Credits = 2 OMR (0.10 per credit)
- **Popular**: 40 Credits = 4 OMR (0.10 per credit) - Most popular option
- **Best Value**: 100 Credits = 10 OMR (0.10 per credit) - Best value

## WhatsApp Message Template

When customers click "Buy Credits", they get this pre-filled message:

```
مرحبا! أريد شراء رصيد للذكاء الاصطناعي

Hello! I want to buy AI credits

User ID: [their_user_id]
Credits: [selected_amount] Credits ([omr_amount] OMR)

سأقوم بتحويل المبلغ الى:
I will transfer the amount to:
Bank Muscat: 96841234567
Account Holder: AL MAALA AL MAAWALI

سأرسل إيصال التحويل بعد ذلك
I will send the transfer receipt afterwards
```

## Admin Verification Process

1. **Receive WhatsApp**: Customer sends purchase request
2. **Wait for Transfer**: Customer sends bank transfer receipt
3. **Verify Payment**: Check bank account for transfer
4. **Add Credits**: Use admin panel to add credits to user account
5. **Confirm**: Send WhatsApp confirmation to customer

## Security Considerations

- Admin key should be long and random
- Only trusted staff should have admin access
- Always verify bank transfers before adding credits
- Keep records of all transactions for accounting

## Customer Support

Common customer questions:
- **"How long until I get credits?"** → Usually within 1-2 hours during business hours
- **"Transfer failed"** → Ask for transfer reference number and bank details
- **"Wrong amount transferred"** → Can add partial credits or refund difference
- **"Account issues"** → Get User ID from customer and check admin panel

## Backup & Monitoring

- All transactions are logged in `credit_transactions` table
- Monitor for unusual patterns or fraud attempts
- Regular database backups recommended
- Set up alerts for high-value purchases

## Local Payment Benefits

- **No Platform Fees**: Direct bank transfers avoid payment processor fees
- **Cultural Trust**: Omanis prefer bank transfers over online payments
- **Customer Service**: Direct WhatsApp communication builds trust
- **Flexibility**: Can handle custom amounts and special cases
- **Compliance**: Works with local banking regulations
