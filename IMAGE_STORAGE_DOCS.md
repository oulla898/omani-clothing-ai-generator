# Image Storage System Documentation

## Overview
The image storage system allows users to save and view their generated images in an organized gallery. Each generated image is automatically saved to the database with the original prompt and metadata.

## Database Schema

### New Table: `user_generations`
```sql
CREATE TABLE user_generations (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Key Features:
- **Foreign Key Constraint**: Links to `user_credits.user_id`
- **Row Level Security**: Users can only access their own images
- **Indexes**: Optimized for user lookups and chronological ordering
- **Cascade Delete**: Images are deleted if user account is removed

## User Interface

### Tab Navigation
- **Generate Tab**: Create new images (existing functionality)
- **History Tab**: View saved images in organized grid

### Image History Features
- **Grid Layout**: Responsive grid showing thumbnails
- **Image Preview**: Click to view full-size image
- **Download**: Save images to device
- **Delete**: Remove images from history
- **Metadata**: Shows prompt and creation date
- **Search**: Find images by prompt (coming soon)

## How It Works

### 1. Image Generation Process
```typescript
1. User enters prompt
2. Credit validation
3. Credit deduction
4. API call to Replicate
5. Image generation
6. Save to database automatically
7. Display in UI
8. Add to history
```

### 2. Image Storage Flow
```typescript
const saveGeneration = async (prompt: string, imageUrl: string) => {
  await supabase
    .from('user_generations')
    .insert([{
      user_id: user.id,
      prompt,
      image_url: imageUrl
    }])
}
```

### 3. Security Measures
- **RLS Policies**: Users can only see their own images
- **User Validation**: All operations validate user ownership
- **Secure URLs**: Images hosted on Replicate's CDN
- **Delete Protection**: Users can only delete their own images

## API Integration

### Supabase Configuration
```typescript
// Updated Database types
export type Database = {
  public: {
    Tables: {
      user_generations: {
        Row: {
          id: string
          user_id: string
          prompt: string
          image_url: string
          created_at: string
          updated_at: string
        }
        // ... Insert & Update types
      }
    }
  }
}
```

### React Hooks
- **`useGenerations`**: Manages image history operations
- **`useCredits`**: Handles credit system (existing)
- **Integration**: Both hooks work together seamlessly

## Database Setup

### 1. Run Migration
```sql
-- Execute in Supabase SQL Editor
-- File: database/add_image_storage.sql
```

### 2. Verify Setup
```sql
-- Check table creation
SELECT * FROM user_generations LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_generations';
```

## Monitoring & Analytics

### Key Metrics to Track
- Total images generated per user
- Most popular prompts
- Storage usage estimates
- User engagement patterns
- Daily/weekly generation trends

### Useful Queries
```sql
-- User engagement
SELECT user_id, COUNT(*) as total_images 
FROM user_generations 
GROUP BY user_id 
ORDER BY total_images DESC;

-- Popular prompts
SELECT LEFT(prompt, 50), COUNT(*) 
FROM user_generations 
GROUP BY LEFT(prompt, 50) 
ORDER BY COUNT(*) DESC;

-- Storage estimate
SELECT COUNT(*) * 0.5 as estimated_mb 
FROM user_generations;
```

## Performance Considerations

### Indexing Strategy
- **Primary Key**: UUID for unique identification
- **User Lookup**: Index on `user_id` for fast queries
- **Chronological**: Index on `created_at` for ordering

### Storage Optimization
- **CDN Hosting**: Images stored on Replicate's CDN
- **Metadata Only**: Database stores URLs, not actual images
- **Compression**: WebP format for optimal file sizes

## Future Enhancements

### Planned Features
1. **Search & Filter**: Find images by prompt keywords
2. **Collections**: Organize images into custom albums
3. **Sharing**: Share images with other users
4. **Export**: Bulk download options
5. **Analytics**: Personal usage statistics

### Potential Improvements
1. **Image Tagging**: Auto-tag generated content
2. **Favorites**: Mark preferred generations
3. **Prompt Templates**: Save frequently used prompts
4. **Collaboration**: Share prompts between users

## Troubleshooting

### Common Issues

#### Images Not Saving
- Check Supabase connection
- Verify RLS policies are correct
- Ensure user authentication is working

#### History Not Loading
- Check network connection to Supabase
- Verify user permissions
- Check browser console for errors

#### Delete Not Working
- Confirm user owns the image
- Check RLS delete policy
- Verify database permissions

### Debug Queries
```sql
-- Check if images are saving
SELECT COUNT(*) FROM user_generations WHERE user_id = 'your_user_id';

-- Check recent activity
SELECT * FROM user_generations 
WHERE created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC;

-- Verify user permissions
SELECT * FROM user_generations WHERE user_id = auth.uid();
```

## Security Best Practices

### Data Protection
- All user data isolated via RLS
- No direct database access from frontend
- Validated user sessions for all operations

### Privacy Considerations
- Users control their own image deletion
- No cross-user data sharing
- Secure image URLs with CDN protection

### Compliance Ready
- GDPR: User can delete their own data
- Data retention: Configurable cleanup policies
- Audit trail: Full timestamp tracking

The image storage system provides a complete solution for users to manage their AI-generated content while maintaining security and performance standards.
