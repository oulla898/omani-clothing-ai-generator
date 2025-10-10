// Simple in-memory rate limiter
// For production, consider using Redis or a proper rate limiting service

interface RateLimitRecord {
  timestamps: number[];
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up old records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(userId: string): { allowed: boolean; remainingRequests: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or create record for this user
    let record = this.records.get(userId);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(userId, record);
    }

    // Filter out timestamps older than the window
    record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (record.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const resetTime = oldestTimestamp + this.windowMs;
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: resetTime
      };
    }

    // Record this request
    record.timestamps.push(now);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - record.timestamps.length,
      resetTime: now + this.windowMs
    };
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [userId, record] of this.records.entries()) {
      // Remove old timestamps
      record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
      
      // Remove empty records
      if (record.timestamps.length === 0) {
        this.records.delete(userId);
      }
    }
  }

  // Get current usage for a user
  getUsage(userId: string): { count: number; limit: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const record = this.records.get(userId);

    if (!record) {
      return { count: 0, limit: this.maxRequests };
    }

    const validTimestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
    return { count: validTimestamps.length, limit: this.maxRequests };
  }
}

// Create a singleton instance for image generation
export const imageGenerationLimiter = new RateLimiter(10, 60000); // 10 requests per 60 seconds
