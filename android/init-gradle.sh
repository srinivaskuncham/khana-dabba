#!/bin/bash

# Exit on error
set -e

# Download Gradle wrapper
gradle wrapper

# Make gradlew executable
chmod +x gradlew

echo "Gradle wrapper initialization complete!"
