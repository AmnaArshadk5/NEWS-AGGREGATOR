import rateLimit from 'express-rate-limit';

// Global API rate limiter (500 requests per 15 minutes per IP)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Authentication rate limiter (50 login/register attempts per 5 minutes per IP)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a few minutes before trying again.' }
});

// News request rate limiter (100 news requests per 5 minutes per IP)
export const newsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'News request limit reached. Please wait a few minutes or use cached feeds.' }
});
