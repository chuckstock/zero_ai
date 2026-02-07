# SwipeClean 📸

A simple, beautiful iOS app for cleaning up your camera roll with Tinder-style swipes.

## Overview

SwipeClean helps users quickly organize their photos using intuitive swipe gestures:
- **Swipe Left** or tap Delete: Remove unwanted photos
- **Swipe Right** or tap Keep: Save the photos you love
- **Undo**: Quickly reverse your last action

### Monetization
- **Free**: First 50 photos
- **Premium**: $2.99 one-time purchase for unlimited access
- No subscription, no recurring fees

## Features

✅ Tinder-style swipe interface  
✅ Safe deletion (moves to iOS Recently Deleted)  
✅ Undo last action  
✅ Real-time stats tracking  
✅ Session progress tracking  
✅ In-app purchases  
✅ Smooth animations  
✅ iOS native design  

## Tech Stack

- **Framework**: Expo + React Native
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Gestures**: React Native Gesture Handler
- **Animations**: React Native Reanimated
- **Photos**: expo-media-library
- **Payments**: expo-in-app-purchases
- **Storage**: AsyncStorage

## Project Structure

```
swipe-clean/
├── App.tsx                          # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx    # Welcome + permissions
│   │   ├── SwipeScreen.tsx         # Main swipe interface
│   │   ├── PaywallScreen.tsx       # Purchase screen
│   │   └── StatsScreen.tsx         # Session statistics
│   ├── components/
│   │   ├── PhotoCard.tsx           # Swipeable photo card
│   │   ├── SwipeButtons.tsx        # Delete/Keep buttons
│   │   ├── ProgressBar.tsx         # Session progress
│   │   └── StatsWidget.tsx         # Stats display
│   ├── hooks/
│   │   ├── usePhotos.tsx           # Photo management
│   │   ├── usePurchase.tsx         # IAP logic
│   │   └── useStats.tsx            # Stats tracking
│   ├── services/
│   │   ├── photoService.ts         # Camera roll access
│   │   ├── purchaseService.ts      # Payment processing
│   │   └── storageService.ts       # Local storage
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── constants/
│       └── index.ts                # App constants
└── docs/
    ├── ARCHITECTURE.md              # Technical architecture
    ├── SETUP.md                     # Setup guide
    └── TESTING.md                   # Testing guide
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Xcode (for iOS development)
- Apple Developer account (for TestFlight/App Store)

### Installation

```bash
# Clone the repo (if needed)
cd swipe-clean

# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios
```

### Configuration

1. **Update Project ID** in `app.json`:
   ```json
   "extra": {
     "eas": {
       "projectId": "your-actual-project-id"
     }
   }
   ```

2. **Configure In-App Purchase** in App Store Connect:
   - Product ID: `com.swipeclean.unlimited`
   - Type: Non-consumable
   - Price: $2.99 USD

3. **Update Bundle ID** if needed in `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.yourcompany.swipeclean"
   }
   ```

## Development

### Run on Device/Simulator

```bash
# iOS Simulator
npm run ios

# Physical iOS device (via Expo Go)
npm start
# Then scan QR code with iOS Camera app
```

### Testing IAP

1. Create a sandbox tester in App Store Connect
2. Sign out of your Apple ID on device
3. Run the app
4. When prompted, sign in with sandbox account

### Common Commands

```bash
# Start dev server
npm start

# Clear cache and restart
npm start --clear

# Run TypeScript check
npx tsc --noEmit

# Build for TestFlight
npx eas build --platform ios --profile preview
```

## Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Manual Build (Xcode)

```bash
# Create native projects
npx expo prebuild

# Open in Xcode
open ios/swipeclean.xcworkspace

# Build and archive in Xcode
```

## App Store Submission

### Required Assets

1. **App Icon**: 1024×1024px (provided in `assets/icon.png`)
2. **Screenshots**: 
   - iPhone 6.7" (required)
   - iPhone 6.5" (required)
   - iPad Pro 12.9" (optional)
3. **Preview Video** (optional but recommended)

### App Store Listing

**Name**: SwipeClean - Photo Cleanup

**Subtitle**: Clean your camera roll with simple swipes

**Description**:
```
SwipeClean makes it easy to organize your photos with intuitive Tinder-style swipes.

Simply swipe left to delete unwanted photos, or swipe right to keep the ones you love. Review hundreds of photos in minutes!

FEATURES:
• Intuitive swipe gestures
• Safe deletion (Recently Deleted folder)
• Undo your last action
• Track your cleanup progress
• View session statistics
• One-time purchase, no subscription

PRICING:
• Free for first 50 photos
• $2.99 one-time unlock for unlimited access

Your photos are important. SwipeClean moves deleted photos to your Recently Deleted folder where they can be restored for 30 days.

Start cleaning up your camera roll today!
```

**Keywords**: photo, cleanup, delete, organize, camera roll, storage, swipe, tidy, photos

**Category**: Utilities

**Age Rating**: 4+

### Privacy Policy

Required disclosures:
- Photo library access (to display and delete photos)
- No data collection
- No tracking
- Purchase history stored locally

## Troubleshooting

### Permission Issues

If users deny photo access:
1. App shows alert explaining why permission is needed
2. Link to Settings app to grant permission
3. App won't proceed without permission

### IAP Not Working

1. Check product ID matches App Store Connect
2. Verify sandbox tester is configured
3. Ensure device is signed out of Apple ID
4. Check App Store Connect agreement status

### Build Errors

```bash
# Clear caches
rm -rf node_modules
npm install
npx expo start --clear

# Reset iOS build
rm -rf ios
npx expo prebuild
```

## Performance

- Loads photos in batches of 20
- Lazy loads as user progresses
- Efficient gesture handling with Reanimated
- Minimal re-renders using React hooks

## Security

- No backend servers
- No data collection
- No analytics
- All data stored locally
- No user accounts

## Future Enhancements

Potential features for v2:
- [ ] Duplicate photo detection
- [ ] Blur detection
- [ ] Bulk actions
- [ ] Smart suggestions
- [ ] iCloud backup integration
- [ ] Multi-select mode
- [ ] Screenshot detection
- [ ] Date range filters

## Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review common issues in this README
3. Contact developer

## License

Copyright © 2026. All rights reserved.

## Credits

Built with:
- Expo
- React Native
- TypeScript
- Lots of ☕

---

Made with ❤️ for people with too many photos
