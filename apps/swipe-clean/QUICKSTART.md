# SwipeClean Quickstart 🚀

Get up and running in 5 minutes!

## Install & Run

```bash
cd swipe-clean
npm install
npm start
```

Then press `i` for iOS simulator.

## Key Files

- `App.tsx` - Main app entry
- `src/screens/` - All screens
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/services/` - Business logic

## Test the App

1. **Simulator**: Photos won't work (needs real device)
2. **Real Device**: 
   ```bash
   npm start
   # Scan QR code with Camera app
   ```

## Configure IAP

1. **App Store Connect** → Your App → In-App Purchases
2. Create product: `com.swipeclean.unlimited` ($2.99)
3. Update `src/constants/index.ts` if you change the product ID

## Build for TestFlight

```bash
# Install EAS
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform ios --profile preview
```

## Common Issues

**"Permission denied"**
- App needs real device with photos
- Simulator has no camera roll

**"IAP not working"**
- Configure sandbox tester in Settings → App Store
- Create product in App Store Connect first

**"Build failed"**
```bash
rm -rf node_modules
npm install
npm start --clear
```

## Next Steps

1. ✅ Test on real device
2. ✅ Configure IAP in App Store Connect
3. ✅ Build for TestFlight
4. ✅ Get beta testers
5. ✅ Submit to App Store

## Documentation

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [docs/SETUP.md](./docs/SETUP.md) - Detailed setup guide
- [docs/TESTING.md](./docs/TESTING.md) - Testing guide

## Support

Need help? Check the docs above or contact support.

---

Happy building! 🎉
