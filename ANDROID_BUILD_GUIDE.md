# Android Build Guide - سجال | Sejal Trivia

## Development Workflow

### First Time Setup

1. Open Android Studio
2. File > Open > Select `SejalTrivia/android` folder
3. Wait for Gradle sync to finish
4. Build > Rebuild Project
5. Run on emulator or device

### Starting Development

Every time you want to test the app:

1. Start Metro bundler in terminal:
   ```
   cd c:\Users\USER\Desktop\Trivia\SejalTrivia
   npx expo start
   ```

2. Open the app on emulator/device (from Android Studio or tap the app icon)

3. The Expo Dev Client screen appears > tap **Connect**

4. The app loads. Any JS/TS code changes hot-reload instantly.

---

## When to Rebuild vs Just Restart Metro

| What changed | Action needed |
|---|---|
| JS/TS code (screens, components, styles) | Nothing - hot-reload is automatic |
| Added a JS-only npm package | Restart Metro (`Ctrl+C` then `npx expo start`) |
| Added a native npm package (has android/ folder) | Rebuild in Android Studio |
| Changed `app.config.js` | Run `npx expo prebuild` then rebuild in Android Studio |
| Changed `.env` values | Restart Metro |

---

## Syncing After Code Changes

### JS/TS changes only (most common)
No sync needed. Metro handles it live.

### After adding a new native package
```
cd c:\Users\USER\Desktop\Trivia\SejalTrivia
npx expo prebuild --clean
```
Then in Android Studio:
1. File > Sync Project with Gradle Files
2. Build > Rebuild Project
3. Run the app

### After pulling new code from git
```
cd c:\Users\USER\Desktop\Trivia\SejalTrivia
npm install
npx expo prebuild --clean
```
Then sync and rebuild in Android Studio.

---

## Production Build (Signed APK / AAB)

### Option 1: EAS Build (Recommended - builds in the cloud)

```bash
# First time only
npm install -g eas-cli
eas login
eas init

# Build Android App Bundle for Play Store
eas build --platform android --profile production

# Build APK for direct install
eas build --platform android --profile preview
```

The signed build works standalone - no Metro needed.

### Option 2: Build locally in Android Studio

1. Build > Generate Signed Bundle / APK
2. Choose Android App Bundle (AAB) for Play Store or APK for direct install
3. Select your keystore or create a new one
4. Choose release build variant
5. Build

---

## Connecting a Physical Device

### Via USB
1. Enable Developer Options on phone (tap Build Number 7 times in Settings > About)
2. Enable USB Debugging in Developer Options
3. Connect phone via USB
4. In terminal:
   ```
   adb reverse tcp:8081 tcp:8081
   ```
5. Start Metro: `npx expo start`
6. Run the app from Android Studio

### Via Wi-Fi (same network)
1. Start Metro: `npx expo start`
2. Open the app on phone
3. In Expo Dev Client, enter your computer's IP: `http://192.168.x.x:8081`
4. Tap Connect

---

## Common Issues

### "Unable to load script" or Dev Client shows but can't connect
- Make sure Metro is running (`npx expo start`)
- For physical device: run `adb reverse tcp:8081 tcp:8081`
- For emulator: it should auto-connect to localhost

### Gradle sync fails
- File > Invalidate Caches and Restart
- Or delete `android/.gradle` and rebuild

### Build fails after adding a new package
```bash
npx expo prebuild --clean
```
Then rebuild in Android Studio.

### Metro cache issues
```bash
npx expo start --clear
```

---

## Project Info

| Field | Value |
|---|---|
| Package Name | com.falsafa.trivia |
| Version | 2.5 |
| Build Number | 9 |
| Min SDK | Set by Expo |
| Target SDK | Set by Expo |
