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
├── middleware.ts                  # Clerk authentication middleware
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

### 3. Responsive Design
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
3. **Main Interface**: Accesses generation interface
4. **Image Generation**: Enters prompt, generates image
5. **Unlimited Usage**: Can generate as many images as desired

### Image Generation Process
1. User enters description of traditional Omani clothing
2. System validates prompt availability
3. Shows loading state with spinner
4. Calls Replicate API with enhanced prompt
5. Displays generated image
6. Ready for next generation

## Database Considerations

### Current State
- Simplified application focused on image generation
- No credit tracking or limitations
- User authentication only

### Future Implementation Needs
- Image generation history
- User analytics and reporting
- Enhanced user profiles

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
- Unlimited image generation for authenticated users
- User authentication requirement
- Scalable architecture
- Ready for future monetization features

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
