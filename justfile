set shell := ["sh", "-cu"]

# Generate native Android project once. Needed because android/ is empty.
prebuild-android:
	@npx expo prebuild --platform android

# Install debug build to connected emulator/device without expo run:android.
android-run: android-debug-install

# Build debug APK locally.
android-debug:
	@cd android && ./gradlew assembleDebug

# Install debug APK to connected emulator/device.
android-debug-install:
	@cd android && ./gradlew installDebug

# Build release APK locally. Requires Android signing config if release signing is enabled.
android-release:
	@cd android && ./gradlew assembleRelease

# Clean native Android build output.
android-clean:
	@cd android && ./gradlew clean

# Print generated APK paths.
apk-paths:
	@find android/app/build/outputs/apk -name '*.apk' -print
