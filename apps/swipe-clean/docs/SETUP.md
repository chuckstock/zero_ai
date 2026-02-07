# SwipeClean Setup Guide

Complete guide to setting up SwipeClean for development and production.

## Development Setup

### 1. Prerequisites

```bash
# Check Node version (18+ required)
node --version

# Check npm version
npm --version

# Install Expo CLI globally (optional)
npm install -g expo-cli

# Install EAS CLI for builds
npm install -g eas-cli
```

### 2. Project Installation

```bash
# Navigate to project
cd swipe-clean

# Install dependencies
npm install

# Verify installation
npm run start
```

### 3. iOS Setup

#### Simulator
```bash
# Install Xcode from App Store
# Open Xcode > Preferences > Components
# Download iOS simulators

# Run on simulator
npm run ios
```

#### Physical Device
```bash
# Method 1: Expo Go (Development)
npm start
# Scan QR code with Camera app

# Method 2: Development Build
eas build --profile development --platform ios
# Install .ipa on device via Apple Configurator
```

## App Store Connect Setup

### 1. Create App

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "+" → New App
3. Fill in details:
   - **Name**: SwipeClean
   - **Bundle ID**: `com.swipeclean.app` (or your custom ID)
   - **SKU**: `swipe-clean-1`
   - **User Access**: Full Access

### 2. Configure In-App Purchase

1. Go to your app → Features → In-App Purchases
2. Click "+" → Create
3. Select: **Non-Consumable**
4. Configure:
   ```
   Reference Name: Unlimited Access
   Product ID: com.swipeclean.unlimited
   
   Pricing:
   - Price: $2.99 USD (Tier 3)
   
   Localization (English):
   - Display Name: Unlimited Photos
   - Description: Unlock unlimited photo cleanup sessions. One-time purchase, no subscription.
   
   Review Information:
   - Screenshot: Upload screenshot of paywall
   - Review Notes: Explain the feature
   ```

5. Submit for Review

### 3. Create Sandbox Testers

1. Go to Users and Access → Sandbox Testers
2. Click "+" to add tester
3. Fill in details (use fake email)
4. Create multiple testers for testing

Example tester:
```
Email: test.swipeclean@example.com
Password: Test1234!
First Name: Test
Last Name: User
Country: United States
```

## EAS Build Configuration

### 1. Initialize EAS

```bash
# Login to Expo account
eas login

# Initialize project
eas build:configure
```

### 2. Configure `eas.json`

Create/update `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "bundleIdentifier": "com.swipeclean.app"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.swipeclean.app"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 3. Build Commands

```bash
# Development build (for testing on device)
eas build --profile development --platform ios

# Preview build (TestFlight)
eas build --profile preview --platform ios

# Production build (App Store)
eas build --profile production --platform ios
```

## Testing IAP in Development

### 1. Configure Sandbox Testing

1. On iOS device, go to Settings
2. Scroll down to "App Store"
3. Tap "Sandbox Account"
4. Sign in with sandbox tester credentials

### 2. Test Purchase Flow

```bash
# Run app on device
npm run ios --device

# Or install development build
eas build --profile development --platform ios
# Install via Apple Configurator or TestFlight
```

Test scenarios:
1. Reach 50 photo limit
2. See paywall
3. Purchase with sandbox account
4. Verify unlock works
5. Test restore purchases

### 3. Reset Purchase for Testing

```bash
# On device:
# Settings → App Store → Sandbox Account → Clear Purchase History
```

## Environment Configuration

### Update `app.json`

```json
{
  "expo": {
    "name": "SwipeClean",
    "slug": "swipe-clean",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.swipeclean.app",
      "buildNumber": "1"
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID_HERE"
      }
    }
  }
}
```

Get your project ID:
```bash
eas project:info
```

## Troubleshooting Setup

### Issue: Dependencies Won't Install

```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: iOS Build Fails

```bash
# Clear iOS build
rm -rf ios
npx expo prebuild --clean

# Rebuild
eas build --platform ios --profile preview
```

### Issue: IAP Not Working

1. **Check Product ID**: Must match exactly
   - Code: `PRODUCT_ID = 'com.swipeclean.unlimited'`
   - App Store Connect: `com.swipeclean.unlimited`

2. **Check Agreement**: App Store Connect → Agreements
   - Must have active Paid Apps agreement

3. **Check Sandbox**: Device signed in with sandbox tester

4. **Check Status**: In-App Purchase approved in App Store Connect

### Issue: Permissions Not Requesting

1. Check `app.json` has correct permissions
2. Delete app from device/simulator
3. Reinstall and try again
4. Check iOS Settings → Privacy → Photos

## Production Checklist

Before submitting to App Store:

- [ ] Update version in `app.json`
- [ ] Update build number
- [ ] Test all features on physical device
- [ ] Test IAP with sandbox account
- [ ] Verify permissions work
- [ ] Check App Store Connect setup:
  - [ ] App Information filled
  - [ ] Screenshots uploaded
  - [ ] In-App Purchase configured
  - [ ] Privacy policy URL (if required)
  - [ ] Support URL
- [ ] Build and test with production profile
- [ ] Submit for review

## Useful Commands

```bash
# Check EAS project info
eas project:info

# Check credentials
eas credentials

# View builds
eas build:list

# View build logs
eas build:view <build-id>

# Cancel build
eas build:cancel <build-id>

# Check submission status
eas submit:list
```

## Next Steps

After setup:
1. Read [TESTING.md](./TESTING.md) for testing guide
2. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details
3. Start developing!

## Support

If you encounter issues:
1. Check error messages carefully
2. Review this guide
3. Check Expo documentation
4. Check Apple Developer forums
