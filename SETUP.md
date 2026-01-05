# Home Stenographer - Setup & Deployment Guide

Your Expo React Native app is ready to test and deploy to iOS and Android app stores!

## Local Development & Testing

### Option 1: Expo Go (Fastest for Testing)
```bash
npm start
```
Then scan the QR code with:
- **iOS**: Camera app, tap notification to open in Expo Go
- **Android**: Expo Go app

### Option 2: iOS Development (macOS Required)
```bash
npm run ios
```

### Option 3: Android Development
```bash
npm run android
```

## Features Included
- ✅ Voice recording with microphone access
- ✅ Recording playback
- ✅ List of all recordings with timestamps
- ✅ Delete recordings
- ✅ Cloud storage via Supabase
- ✅ Proper permissions for iOS and Android

## Building for App Stores

### Prerequisites
1. **Apple Developer Account**: $99/year (for iOS)
2. **Google Play Developer Account**: $25 one-time (for Android)
3. **Expo Account**: Free (for cloud builds)

### Step 1: Set Up Expo Cloud Builds
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Step 2: Build for iOS
```bash
eas build --platform ios
```

### Step 3: Build for Android
```bash
eas build --platform android
```

### Step 4: Submit to App Stores
```bash
eas submit --platform ios
eas submit --platform android
```

## Important Notes

### App Store Submission
- **iOS**: Requires Apple Developer Certificate signing and TestFlight review
- **Android**: Direct upload to Google Play Console
- Both require app descriptions, screenshots, and privacy policy
- Review time: 1-7 days for iOS, 2-4 hours for Android

### Privacy & Permissions
- The app requests microphone permission on install
- Recordings are stored in Supabase (your cloud database)
- Make sure to add a privacy policy to your app store listing

### Version Updates
Update `version` in `app.json` before each build:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

## File Structure
```
/project
├── App.tsx              # Main app component
├── app.json            # Expo config (permissions, icon, etc)
├── package.json        # Dependencies
├── assets/             # App icons and splash screen
├── ios/                # Generated iOS native code
└── android/            # Generated Android native code
```

## Troubleshooting

### Microphone Not Working
- Check `app.json` for microphone permissions
- On iOS, make sure the app has permission in Settings > Privacy > Microphone
- On Android, grant permission when app first runs

### Recording Upload Issues
- Verify Supabase credentials in `.env`
- Check that Supabase `recordings` table exists
- Test with a small recording first

### Build Fails
- Clean build: `rm -rf node_modules ios android && npm install && npm run build`
- Update Expo: `npm install -g expo-cli@latest`

## Next Steps

1. Test the app locally with Expo Go
2. Make any customizations (app name, colors, features)
3. Create developer accounts for iOS and Android
4. Run the build commands above
5. Submit to app stores

Your app will be visible in both stores once it passes review!
