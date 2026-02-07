// App Configuration
export const APP_NAME = 'SwipeClean';
export const APP_VERSION = '1.0.0';

// Monetization
export const FREE_PHOTO_LIMIT = 50;
export const PREMIUM_PRICE = 2.99;
export const PRODUCT_ID = 'com.swipeclean.unlimited';

// Photo Loading
export const PHOTOS_PER_BATCH = 20;
export const MAX_PHOTOS_LOADED = 100;

// UI
export const SWIPE_THRESHOLD = 120; // pixels
export const ANIMATION_DURATION = 300; // ms

// Storage Keys
export const STORAGE_KEYS = {
  PURCHASE_STATE: '@swipeclean:purchase_state',
  SESSION_STATS: '@swipeclean:session_stats',
  ONBOARDING_COMPLETE: '@swipeclean:onboarding_complete',
  HISTORY: '@swipeclean:history',
} as const;

// Colors
export const COLORS = {
  primary: '#007AFF',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
} as const;
