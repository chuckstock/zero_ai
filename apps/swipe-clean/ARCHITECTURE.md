# SwipeClean - Photo Cleanup App Architecture

## Overview
iOS app for quickly cleaning up your camera roll using Tinder-style swipe gestures.

## Core Features

### 1. Photo Management
- Access camera roll using `expo-media-library`
- Display photos one at a time in swipe interface
- Load photos in batches for performance
- Track photo selection history

### 2. Swipe Gestures
- **Swipe Right (or tap Keep button)**: Keep photo
- **Swipe Left (or tap Delete button)**: Delete photo
- Visual feedback during swipe
- Smooth animations
- Undo last action

### 3. Monetization
- Free: First 50 photos
- One-time purchase: $2.99 for unlimited
- Implemented with `expo-in-app-purchases`
- Persistent purchase state
- Restore purchases functionality

### 4. Deletion Strategy
- Move to iOS "Recently Deleted" folder
- User can restore within 30 days
- Safe, reversible deletion

### 5. Stats & Progress
- Photos reviewed
- Photos deleted
- Storage saved
- Session progress

## Tech Stack

### Core
- **Expo SDK 52+**
- **React Native**
- **TypeScript**
- **React Navigation** (for screens)

### Key Libraries
- `expo-media-library` - Camera roll access
- `react-native-gesture-handler` - Swipe gestures
- `react-native-reanimated` - Smooth animations
- `expo-in-app-purchases` - Payment processing
- `@react-native-async-storage/async-storage` - Local persistence

### UI
- React Native Paper (Material Design)
- Custom swipe card component
- Clean, minimal design

## Project Structure

```
swipe-clean/
├── App.tsx                      # Root component
├── app.json                     # Expo config
├── package.json
├── tsconfig.json
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx    # Welcome + permissions
│   │   ├── SwipeScreen.tsx         # Main swipe interface
│   │   ├── StatsScreen.tsx         # Session stats
│   │   └── PaywallScreen.tsx       # Purchase screen
│   ├── components/
│   │   ├── PhotoCard.tsx           # Swipeable photo card
│   │   ├── SwipeButtons.tsx        # Keep/Delete buttons
│   │   ├── ProgressBar.tsx         # Session progress
│   │   └── StatsWidget.tsx         # Stats display
│   ├── hooks/
│   │   ├── usePhotos.tsx           # Photo loading logic
│   │   ├── usePurchase.tsx         # IAP logic
│   │   └── useStats.tsx            # Stats tracking
│   ├── services/
│   │   ├── photoService.ts         # Media library operations
│   │   ├── purchaseService.ts      # IAP implementation
│   │   └── storageService.ts       # AsyncStorage wrapper
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── constants/
│       └── index.ts                # App constants
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── docs/
    ├── ARCHITECTURE.md
    ├── SETUP.md
    └── TESTING.md
```

## User Flow

### First Launch
1. Onboarding screen
   - Explain app concept
   - Request photo library permissions
   - Show pricing (free 50, then $2.99)
2. Navigate to Swipe Screen

### Swipe Session
1. Load next photo
2. User swipes or taps button
3. Photo moves to next with animation
4. Update stats
5. At 50 photos (free limit):
   - Show paywall
   - Option to purchase or quit
6. Continue until all photos reviewed

### Purchase Flow
1. Show paywall screen
2. User taps "Unlock Unlimited"
3. iOS payment sheet
4. On success: unlock + continue
5. On cancel: return to paywall

## Data Models

### Photo
```typescript
interface Photo {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  fileSize: number;
}
```

### Stats
```typescript
interface SessionStats {
  photosReviewed: number;
  photosDeleted: number;
  photosKept: number;
  storageSaved: number; // bytes
  sessionStartTime: number;
}
```

### Purchase State
```typescript
interface PurchaseState {
  isPremium: boolean;
  purchaseDate: number | null;
  transactionId: string | null;
}
```

## Permissions Required

### iOS (Info.plist)
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to your photos to help you clean up your camera roll.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need permission to delete photos from your library.</string>
```

## In-App Purchase Configuration

### App Store Connect
1. Product ID: `com.swipeclean.unlimited`
2. Type: Non-consumable
3. Price: $2.99 USD
4. Name: "Unlimited Photos"
5. Description: "Unlock unlimited photo cleanup sessions"

## State Management

Using React hooks and Context API:
- `PhotoContext` - Photo loading and management
- `PurchaseContext` - IAP state
- `StatsContext` - Session statistics

## Performance Optimizations

1. **Lazy Loading**: Load photos in batches of 10
2. **Image Optimization**: Use thumbnails when possible
3. **Gesture Optimization**: Use `useSharedValue` from reanimated
4. **Memory Management**: Clean up unused photo references

## Error Handling

### Permission Denied
- Show alert explaining why permission is needed
- Link to Settings app
- Cannot proceed without permission

### Purchase Errors
- Network errors: Retry option
- User cancelled: Return to paywall
- Invalid receipt: Contact support message

### Photo Loading Errors
- Skip corrupted photos
- Show error count in stats
- Continue to next photo

## Testing Strategy

### Unit Tests
- Photo service functions
- Purchase logic
- Stats calculations

### Integration Tests
- Photo loading flow
- Purchase flow
- Navigation

### Manual Testing
- Swipe gestures on device
- Purchase flow (sandbox)
- Permissions
- Performance with large libraries

## Deployment

### Build for TestFlight
```bash
eas build --platform ios --profile preview
```

### Submit to App Store
```bash
eas submit --platform ios
```

## Future Enhancements

1. **Smart Deletion**
   - Duplicate detection
   - Blur detection
   - Similar photo suggestions

2. **Bulk Actions**
   - Select multiple photos
   - Delete all screenshots
   - Delete by date range

3. **Cloud Backup**
   - Export before delete
   - iCloud integration

4. **Social Features**
   - Share cleanup stats
   - Challenge friends

## App Store Listing

### Name
SwipeClean - Photo Cleanup

### Subtitle
Clean your camera roll with simple swipes

### Keywords
photo, cleanup, delete, organize, camera roll, storage, swipe

### Category
Utilities

### Privacy
- Photo library access
- No data collection
- No tracking
- Purchase history stored locally

## Monetization Details

### Pricing Strategy
- Free tier: 50 photos (proves value)
- Premium: $2.99 (low friction, high conversion)
- No subscription (better UX)

### Revenue Projection
- 1000 users @ 30% conversion = 300 purchases
- 300 × $2.99 = $897 revenue
- After Apple's 30% cut = $628

## Development Timeline

### Phase 1: Core App (Day 1)
- ✅ Project setup
- ✅ Basic UI
- ✅ Photo loading
- ✅ Swipe gestures
- ✅ Delete functionality

### Phase 2: Polish (Day 2)
- ✅ Stats tracking
- ✅ Animations
- ✅ Error handling
- ✅ Onboarding

### Phase 3: IAP (Day 3)
- ✅ Purchase integration
- ✅ Paywall screen
- ✅ State persistence
- ✅ Testing

### Phase 4: Testing & Launch (Day 4-5)
- ✅ TestFlight
- ✅ Bug fixes
- ✅ App Store submission
- ✅ Launch

## Success Metrics

1. **Engagement**: Photos reviewed per session
2. **Conversion**: Free to paid rate
3. **Retention**: Users returning for more sessions
4. **Performance**: App responsiveness, crash rate

---

Ready to build! 🚀
