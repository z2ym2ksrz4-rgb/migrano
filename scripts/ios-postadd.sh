#!/usr/bin/env bash
# Runs in CI right after `npx cap add ios`: Info.plist keys, deployment target 15.5
# (required by the WidgetBridge pod / WidgetKit), iPhone-only device family.
set -euo pipefail
PLIST=ios/App/App/Info.plist
PB=/usr/libexec/PlistBuddy
set_key() { $PB -c "Set :$1 '$2'" "$PLIST" 2>/dev/null || $PB -c "Add :$1 string '$2'" "$PLIST"; }
# HealthKit (write-only headache samples; optional, toggled in Settings)
set_key NSHealthUpdateUsageDescription "Migrano can write your logged attacks to Apple Health as headache entries, if you turn it on in Settings."
set_key NSHealthShareUsageDescription "Migrano does not read any Health data. This is only needed to show the Apple Health permission screen."
$PB -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null || $PB -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST"
# Deployment target -> 15.5 (Xcode project + Podfile)
sed -i '' -E 's/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = 15.5;/g' ios/App/App.xcodeproj/project.pbxproj
sed -i '' -E "s/platform :ios, '[0-9.]+'/platform :ios, '15.5'/" ios/App/Podfile
grep -n "platform :ios" ios/App/Podfile
# Every pod target gets at least 15.5 (inserted into Capacitor's existing post_install hook)
sed -i '' 's/  assertDeploymentTarget(installer)/  assertDeploymentTarget(installer)\
  installer.pods_project.targets.each { |t| t.build_configurations.each { |c| c.build_settings["IPHONEOS_DEPLOYMENT_TARGET"] = "15.5" if c.build_settings["IPHONEOS_DEPLOYMENT_TARGET"].to_f < 15.5 } }/' ios/App/Podfile
echo "Info.plist and deployment target updated"
# iPhone only (the UI is designed for phones). Widget extension inherits via ios-widget.rb.
sed -i '' -E 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = "1";/g' ios/App/App.xcodeproj/project.pbxproj
grep -c 'TARGETED_DEVICE_FAMILY = "1";' ios/App/App.xcodeproj/project.pbxproj || true
