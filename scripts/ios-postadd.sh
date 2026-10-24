#!/usr/bin/env bash
# Runs in CI right after `npx cap add ios`: adds the Info.plist purpose strings Apple requires
# for the Capacitor camera/photo plugins and raises the deployment target to iOS 15.
set -euo pipefail
PLIST=ios/App/App/Info.plist
PB=/usr/libexec/PlistBuddy
set_key() { $PB -c "Set :$1 '$2'" "$PLIST" 2>/dev/null || $PB -c "Add :$1 string '$2'" "$PLIST"; }
set_key NSCameraUsageDescription "This app uses the camera to add photos."
set_key NSPhotoLibraryUsageDescription "This app lets you pick photos from your library."
set_key NSPhotoLibraryAddUsageDescription "This app can save exports to your photo library."
$PB -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || $PB -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST"
# Deployment target 14.0 -> 15.0 (Xcode project + Podfile)
sed -i '' 's/IPHONEOS_DEPLOYMENT_TARGET = 14.0;/IPHONEOS_DEPLOYMENT_TARGET = 15.0;/g' ios/App/App.xcodeproj/project.pbxproj
sed -i '' "s/platform :ios, '14.0'/platform :ios, '15.0'/" ios/App/Podfile
echo "Info.plist and deployment target updated"
