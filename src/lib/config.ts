// Frontend-Backend Integration Configuration
// 
// To change the backend URL, set the environment variable:
// NEXT_PUBLIC_API_URL=http://localhost:5000
//
// Or create a .env.local file (gitignored) with:
// NEXT_PUBLIC_API_URL=http://your-backend-url:5000

export const CONFIG = {
  // API Base URL - defaults to localhost:5000
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

  // Cache TTL in milliseconds (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,

  // Default pagination
  DEFAULT_PAGE_SIZE: 20,

  // Feature flags
  FEATURES: {
    REALTIME_UPDATES: false,  // Enable when WebSocket is implemented
    OFFLINE_MODE: true,       // localStorage caching
  },
} as const;

// Validation
if (typeof window !== 'undefined') {
  console.log('[Config] API Base URL:', CONFIG.API_BASE_URL);
}

export default CONFIG;
