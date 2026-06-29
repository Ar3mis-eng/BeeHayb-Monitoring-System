# Android USB Debugging Setup Guide

Follow these steps to enable USB debugging and run the app on a physical Android device.

## Step 1: Enable Developer Mode

1. Open **Settings** on your Android device
2. Scroll to **About Phone** (or **About Device**)
3. Find **Build Number** and tap it **7 times** rapidly
4. You'll see a notification: "You are now a developer!"
5. Go back to Settings and look for **Developer Options**

## Step 2: Enable USB Debugging

1. Open **Settings** > **Developer Options**
2. Find and enable **USB Debugging**
3. A dialog will appear asking to allow USB debugging
4. Tap **Allow** or **Always allow**

## Step 3: Connect Device

1. Connect your Android device to your computer with a USB cable
2. Select **File Transfer** or **MTP** mode when prompted on the device
3. Open Terminal/PowerShell and verify:

```bash
adb devices
```

You should see your device listed:

```
List of attached devices
ABC123DEF456    device
```

## Step 4: Run the App

From the `mobile` directory:

```bash
npm run android
```

Or manually:

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Build and run on device
npx react-native run-android
```

## Troubleshooting

### Device Not Found

```bash
# Check ADB status
adb status

# Restart ADB daemon
adb kill-server
adb start-server

# Try again
adb devices
```

### "No devices attached"

- Disconnect and reconnect USB cable
- Try a different USB port
- Tap the notification on device to "Allow" USB debugging again
- Restart the device

### Port Already in Use

```bash
# Find process on port 5037 (ADB)
# macOS/Linux: lsof -i :5037
# Windows: netstat -ano | findstr :5037

# Kill the process and restart
adb kill-server
adb start-server
```

### Metro Bundler Crashes

```bash
cd mobile
npm install
npm start -- --reset-cache
```

### APK Installation Issues

```bash
# Uninstall previous version
adb uninstall com.beehayb

# Clear cache
npm start -- --reset-cache

# Try running again
npm run android
```

## Building Release APK

For production builds (to submit to Google Play):

```bash
cd mobile/android
./gradlew assembleRelease
# Output: mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Signing Release Build

Before uploading to Play Store, sign your APK:

```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore my-release-key.jks \
  app-release.apk alias_name

zipalign -v 4 app-release.apk app-release-aligned.apk
```

## WebSocket Connection

Make sure to update the `.env` file with your backend server's IP:

```bash
# mobile/.env
REACT_APP_API_URL=http://192.168.X.X:5000/api
REACT_APP_WS_URL=http://192.168.X.X:5001
```

Replace `192.168.X.X` with your computer's IP address.

To find your IP:

- **macOS/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig | grep IPv4`

## Viewing Logs

View real-time app logs:

```bash
adb logcat | grep "BeeHayb\|ReactNative"
```

## Performance Monitoring

React Native includes built-in performance tools:

1. Shake device or press Ctrl+M (Android)
2. Select **Show Inspector**
3. Use Perf Monitor to track FPS

---

**Happy Monitoring! 🐝**
