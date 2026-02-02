# iOS Build Guide - سجال | Sejal Trivia

## Overview

Since you're developing on Windows, you CANNOT build iOS locally (requires macOS + Xcode).
Instead, use **EAS Build** which builds in the cloud on Apple servers.

---

## One-Time Setup

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Create an Expo account

Go to https://expo.dev and sign up, then:

```bash
eas login
```

### 3. Initialize EAS in your project

```bash
cd c:\Users\USER\Desktop\Trivia\SejalTrivia
eas init
```

This creates a project on Expo's servers and adds the `projectId` to your `app.config.js`.

### 4. Apple Developer Account

You need an Apple Developer account ($99/year): https://developer.apple.com

EAS will ask for your Apple credentials during the first build. It handles:
- Certificates
- Provisioning profiles
- Bundle ID registration
- App Store Connect setup

You do NOT need a Mac for any of this.

---

## Generate iOS Directory

Even though you can't build locally, you need the iOS files for EAS:

```bash
npx expo prebuild --platform ios
```

If this fails on Windows (no CocoaPods), that's OK - EAS Build handles it in the cloud.

---

## Building for iOS

### Development Build (for testing on a physical iPhone)

```bash
eas build --platform ios --profile development
```

- First time: EAS asks for your Apple ID and password
- It registers your device automatically (or use `eas device:create`)
- Downloads as .ipa file
- Install via AltStore, Apple Configurator, or Expo dashboard

### Preview Build (for TestFlight / internal testing)

```bash
eas build --platform ios --profile preview
```

- Creates an .ipa for internal distribution
- Can be uploaded to TestFlight manually

### Production Build (for App Store)

```bash
eas build --platform ios --profile production
```

- Creates an optimized .ipa ready for App Store
- JS bundle is embedded (no Metro needed)
- Signed with your distribution certificate

---

## Submitting to App Store

### Option 1: EAS Submit (Recommended)

First, update `eas.json` with your Apple credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your@email.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCDE12345"
    }
  }
}
```

To find these values:
- **appleId**: Your Apple ID email
- **ascAppId**: Go to App Store Connect > Your App > General > App Information > Apple ID
- **appleTeamId**: Go to https://developer.apple.com/account > Membership > Team ID

Then submit:

```bash
eas submit --platform ios --profile production
```

### Option 2: Manual Upload

1. Download the .ipa from Expo dashboard (https://expo.dev)
2. On a Mac, use Transporter app to upload to App Store Connect
3. Or use Application Loader on older macOS versions

---

## Registering Test Devices

To install development/preview builds on physical iPhones:

```bash
# Register a new device
eas device:create

# This generates a URL - open it on the iPhone to register
# The device UDID is captured automatically
```

After registering, rebuild with `--profile development` to include the new device.

---

## Managing Certificates & Profiles

EAS manages these automatically, but if you need to:

```bash
# View existing credentials
eas credentials --platform ios

# Reset and regenerate
eas credentials --platform ios --clear
```

---

## Environment Variables for Production

Set secrets so they're available during cloud builds:

```bash
eas secret:create --scope project --name API_BASE_URL --value "https://trivia-game-react-native-copy-production.up.railway.app/api"

eas secret:create --scope project --name GOOGLE_WEB_CLIENT_ID --value "732862624643-3fhlnic3b60b0mara1tbv7klf9978hrn.apps.googleusercontent.com"

eas secret:create --scope project --name GOOGLE_IOS_CLIENT_ID --value "732862624643-b2kk4bi105kmfn4ubecu6k6687e3b37n.apps.googleusercontent.com"

eas secret:create --scope project --name GOOGLE_ANDROID_CLIENT_ID --value "732862624643-4c8njltnaqkrhc41ks39hh6t10lr1tqv.apps.googleusercontent.com"
```

These become `process.env.*` during build and flow into `app.config.js` > `extra` block.

---

## App Store Configuration

Your app is already configured in `app.config.js`:

| Field | Value |
|---|---|
| Bundle ID | com.falsafa.trivia |
| Version | 2.5 |
| Build Number | 9 |
| Display Name | سجال \| Sejal |
| Apple Sign-In | Enabled (via entitlements) |
| In-App Purchases | Enabled (via entitlements) |
| Google Sign-In | URL scheme configured |

### Capabilities (auto-configured by Expo plugins)
- Sign in with Apple
- In-App Purchase
- Google Sign-In URL scheme

---

## Updating the App

### Update version for a new release

Edit `app.config.js`:

```js
version: '2.6',        // User-visible version
ios: {
  buildNumber: '10',   // Increment for each upload
}
```

Or use auto-increment (already set in eas.json):
```bash
eas build --platform ios --profile production --auto-submit
```

### OTA Updates (no App Store review needed)

For JS-only changes, you can push updates instantly:

```bash
npx expo install expo-updates
eas update --branch production --message "Fix bug in question modal"
```

Users get the update next time they open the app. No App Store review required.

---

## Common Commands Reference

```bash
# Build
eas build --platform ios --profile development    # Dev build
eas build --platform ios --profile preview        # TestFlight
eas build --platform ios --profile production     # App Store

# Submit
eas submit --platform ios                         # Upload to App Store

# Build + Submit in one command
eas build --platform ios --profile production --auto-submit

# Check build status
eas build:list --platform ios

# View credentials
eas credentials --platform ios

# Register test device
eas device:create

# OTA update
eas update --branch production --message "description"

# View all secrets
eas secret:list
```

---

## Workflow Summary

```
Code changes (Windows)
        |
        v
  git push (optional)
        |
        v
  eas build --platform ios --profile production
        |
        v
  EAS builds in the cloud (no Mac needed)
        |
        v
  eas submit --platform ios
        |
        v
  App Store Connect (review)
        |
        v
  Published on App Store
```

No Mac, no Xcode, no certificates hassle. EAS handles everything.
