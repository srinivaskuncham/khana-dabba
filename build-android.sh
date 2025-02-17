#!/bin/bash

# Exit on error
set -e

echo "Building Android APK..."

# Navigate to android directory
cd android

# Clean previous builds
./gradlew clean

# Bundle React Native code
cd ..
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Build debug APK
cd android
./gradlew assembleDebug

echo "Build completed! Your APK can be found at:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"
