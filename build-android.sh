#!/bin/bash

# Exit on error
set -e

echo "Building Android APK..."

# Make sure gradlew is executable
chmod +x android/gradlew

# Navigate to android directory
cd android

# Clean and build the app module specifically
./gradlew clean
./gradlew assembleDebug

echo "Build completed! Your APK can be found at:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"