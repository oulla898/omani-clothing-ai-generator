# Omani Traditional Clothing AI Generator - Project Documentation

## Project Overview

This is a commercial AI image generation web application built with Next.js that specializes in generating images of traditional Omani clothing using a trained LoRA (Low-Rank Adaptation) model. The project integrates modern technologies to provide a complete user experience with authentication and AI image generation capabilities.

## Technology Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Geist Font** - Custom font from Vercel

### Backend & APIs
- **Next.js API Routes** - Server-side API endpoints
- **Replicate API** - AI image generation service
- **Clerk** - Authentication and user management
- **Supabase** - PostgreSQL database for credit tracking

### Development Tools
- **ESLint** - Code linting
- **Turbopack** - Fast build tool
- **PostCSS** - CSS processing

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── predictions/           # AI image generation API
│   │       └── route.ts
│   ├── sign-in/                   # Authentication pages
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout with Clerk provider
│   └── page.tsx                   # Main application page
├── hooks/
│   └── useCredits.ts              # Credit management hook
├── lib/
│   └── supabase.ts                # Supabase client configuration
├── middleware.ts                  # Clerk authentication middleware
database/
└── setup.sql                      # Database schema for credit system
public/                            # Static assets
```

## Key Features

### 1. User Authentication System
- **Provider**: Clerk Authentication
- **Features**: Sign-in, sign-up, user management
- **Protection**: Middleware protects all routes except sign-in/sign-up
- **User Data**: Access to user profile, email, name

### 2. AI Image Generation
- **Service**: Replicate API
- **Model**: Custom LoRA model (version: `16fe80f481f289b423395181cb81f78a3e88018962e689157dcfeba15f149e2a`)
- **Specialty**: Traditional Omani clothing generation
- **Process**: 
  - User inputs prompt
  - System automatically prefixes with "omani" for context
  - Generates 1:1 aspect ratio images in WebP format
  - Uses 28 inference steps for quality

### 3. Credit System
- **Database**: Supabase PostgreSQL
- **Storage**: User credits tracked per Clerk user ID
- **Allocation**: New users receive 10 free credits
- **Cost**: 1 credit per image generation
- **Validation**: Credits checked before generation
- **Security**: Row Level Security (RLS) for data protection

### 4. Responsive Design
- **Framework**: Tailwind CSS
- **Layout**: Grid-based responsive design
- **Colors**: Purple/blue gradient theme
- **Components**: Cards, buttons, forms with proper hover states

## API Endpoints

### POST `/api/predictions`
Generates AI images of traditional Omani clothing.

**Authentication**: Required (Clerk)
**Request Body**:
```json
{
  "prompt": "description of traditional Omani clothing"
}
```

**Response**:
```json
{
  "id": "prediction_id",
  "output": ["image_url"],
  "status": "succeeded"
}
```

**Process**:
1. Validates user authentication
2. Adds "omani" prefix to user prompt
3. Calls Replicate API with specific model parameters
4. Polls for completion
5. Returns generated image URL

## Environment Variables

### Required for Production
```env
REPLICATE_API_TOKEN=your_replicate_token_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Replicate Model Configuration
```javascript
{
  version: '16fe80f481f289b423395181cb81f78a3e88018962e689157dcfeba15f149e2a',
  input: {
    prompt: `omani, ${userPrompt}`,
    model: "dev",
    go_fast: false,
    lora_scale: 1,
    megapixels: "1",
    num_outputs: 1,
    aspect_ratio: "1:1",
    output_format: "webp",
    guidance_scale: 3,
    output_quality: 80,
    prompt_strength: 0.8,
    extra_lora_scale: 1,
    num_inference_steps: 28
  }
}
```

## Security Features

### Authentication Middleware
- Protects all routes except public auth pages
- Uses Clerk's server-side authentication
- Validates requests before API access

### API Security
- All API routes require authentication
- User validation on every request
- Error handling for unauthorized access

## User Experience Flow

### New User Journey
1. **Landing Page**: Sees sign-in prompt with project description
2. **Authentication**: Signs up/in via Clerk
3. **Credit Allocation**: Automatically receives 10 free credits
4. **Main Interface**: Accesses generation interface with credit display
5. **Image Generation**: Enters prompt, uses 1 credit per generation
6. **Credit Management**: Can see remaining credits and usage limits

### Image Generation Process
1. User enters description of traditional Omani clothing
2. System validates credit availability
3. Deducts 1 credit from user balance
4. Shows loading state with spinner
5. Calls Replicate API with enhanced prompt
6. Displays generated image
7. Updates credit display
8. Ready for next generation (if credits remain)

## Database Architecture

### Current Implementation
- **Supabase PostgreSQL**: Production-ready database
- **Credit Tracking**: Real-time credit balance management
- **User Management**: Linked to Clerk authentication
- **Security**: Row Level Security (RLS) policies
- **Performance**: Optimized indexes and triggers

### Database Schema
```sql
user_credits table:
- id: UUID (Primary Key)
- user_id: TEXT (Clerk User ID)
- credits: INTEGER (Default: 10)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP (Auto-updated)
```

### Future Enhancement Needs
- Credit purchase system integration
- Image generation history tracking
- User analytics and usage reporting
- Enhanced user profiles with preferences

## Deployment Configuration

### Vercel Ready
- Next.js configuration optimized for Vercel
- Environment variables configured
- Image domains whitelisted for Replicate

### Build Configuration
- Turbopack for fast builds
- TypeScript compilation
- ESLint validation
- CSS optimization

## Commercial Features

### Monetization Ready
- User authentication system
- Scalable architecture
- Ready for future business features

### Business Logic
- **Freemium Model**: 10 free credits for new users
- **Usage-Based**: 1 credit per image generation
- **Scalable Pricing**: Ready for credit purchase system
- **User Retention**: Credit system encourages engagement
- **Monetization Ready**: Foundation for subscription or pay-per-use models

## Technical Excellence

### Code Quality
- TypeScript for type safety
- ESLint configuration with Next.js rules
- Consistent code formatting
- Error handling throughout

### Performance
- Next.js 15 with App Router
- Turbopack for fast development
- Image optimization for generated content
- Responsive design for all devices

### Maintainability
- Clear component separation
- Modular API structure
- Environment-based configuration
- Documentation and comments

## Future Enhancement Opportunities

1. **Database Integration**: Add persistent storage for user data
2. **Credit System**: Implement usage-based monetization if needed
3. **Image History**: Save and display user's generated images
4. **Admin Panel**: Create administrative interface for user management
5. **API Rate Limiting**: Implement request throttling
6. **Error Logging**: Add comprehensive error tracking
7. **Cache Layer**: Implement image and response caching
8. **Mobile App**: React Native version for mobile users

## Getting Started

### Development Setup
```bash
npm install
npm run dev
```

### Environment Setup
1. Create `.env.local` file
2. Add required environment variables
3. Configure Clerk authentication
4. Set up Replicate API access

### Production Deployment
1. Deploy to Vercel
2. Configure environment variables in dashboard
3. Set up custom domain if needed
4. Monitor application performance

This project represents a streamlined, production-ready AI image generation platform specifically tailored for Omani traditional clothing, with authentication and unlimited generation capabilities for authenticated users.
