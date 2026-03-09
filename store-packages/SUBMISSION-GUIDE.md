# Home Buddy — App Store Submission Guide

## Package Structure

```
store-packages/
├── android/          ← Google Play Store (TWA)
├── windows/          ← Microsoft Store (PWA/Hosted Web App)
├── ios/              ← Apple App Store (WKWebView wrapper)
└── SUBMISSION-GUIDE.md
```

---

## 1. Google Play Store (Android TWA)

### What's included
- Complete Android project using Trusted Web Activity (TWA)
- All icon sizes (mdpi through xxxhdpi)
- Adaptive icon foreground
- 512x512 Play Store icon
- AndroidManifest.xml with intent filters and Digital Asset Links

### Prerequisites
- Google Play Developer account ($25 one-time): https://play.google.com/console
- Android Studio installed
- Java 17+

### Steps

1. **Open the project in Android Studio**
   ```
   Open Android Studio → File → Open → select store-packages/android/
   ```

2. **Set up signing**
   - Build → Generate Signed Bundle/APK
   - Create a new keystore (save it securely — you need it for every update)
   - Note your keystore SHA-256 fingerprint:
     ```bash
     keytool -list -v -keystore your-keystore.jks -alias your-alias
     ```

3. **Configure Digital Asset Links**
   - Edit `assetlinks.json` — replace `TODO:REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with your signing key's SHA-256 fingerprint
   - Host this file at: `https://home-buddy.replit.app/.well-known/assetlinks.json`
   - This proves your app owns the domain (required for TWA to hide the URL bar)

4. **Build the release AAB**
   ```
   Build → Generate Signed Bundle/APK → Android App Bundle → Release
   ```

5. **Submit to Play Console**
   - Create a new app in Google Play Console
   - Upload the `.aab` file
   - Fill in store listing (see Store Listing section below)
   - Set content rating, pricing (Free), and target audience
   - Submit for review

### Store Listing Details
- **App name**: Home Buddy - Home Maintenance Planner
- **Short description**: Free AI home maintenance planner. Track systems, schedule tasks, upload inspection reports.
- **Category**: House & Home
- **Tags**: home maintenance, home repair, home inspection, DIY, HVAC, plumbing

---

## 2. Microsoft Store (Windows)

### What's included
- `appxmanifest.xml` — Windows app package manifest
- `pwabuilder-config.json` — PWABuilder configuration
- All required tile icons (44x44 through 620x620, wide tile, store logo)

### Option A: PWABuilder (Recommended — Easiest)

1. Go to https://www.pwabuilder.com
2. Enter `https://home-buddy.replit.app/`
3. Click "Package for stores" → Windows
4. Upload the icons from `store-packages/windows/`
5. Use the publisher info from `pwabuilder-config.json`
6. Download the generated MSIX package
7. Submit to Microsoft Partner Center

### Option B: Manual MSIX Packaging

1. **Prerequisites**
   - Windows 10/11 with Visual Studio 2022
   - Windows Application Packaging Project template
   - Microsoft Partner Center account ($19 one-time): https://partner.microsoft.com

2. **Create the package**
   - Open Visual Studio → Create New Project → Windows Application Packaging Project
   - Copy `appxmanifest.xml` content into your Package.appxmanifest
   - Replace `CN=TODO_YOUR_PUBLISHER_ID` with your actual Publisher ID from Partner Center
   - Copy all icon PNGs into the project's Assets folder

3. **Build MSIX**
   - Right-click project → Publish → Create App Packages
   - Associate with your Partner Center app
   - Build for x64 and ARM64

4. **Submit to Partner Center**
   - Create a new app submission
   - Upload the `.msix` or `.msixbundle`
   - Fill in store listing
   - Submit for certification

### Store Listing Details
- **App name**: Home Buddy - AI Home Maintenance Planner
- **Category**: Utilities & tools
- **Description**: Your AI-powered home maintenance planner. Track HVAC, plumbing, roof, and electrical systems. Upload inspection reports for automatic analysis. Get personalized maintenance schedules and know what's safe to DIY. Free forever.

---

## 3. Apple App Store (iOS)

### What's included
- Complete Xcode project (`HomeBuddy.xcodeproj`)
- Swift source files (AppDelegate + WebViewController with WKWebView)
- Full AppIcon asset catalog (all required sizes, 20x20 through 1024x1024)
- LaunchScreen storyboard (centered logo + app name)
- Info.plist with App Transport Security, orientation, and encryption declarations

### Prerequisites
- Mac with Xcode 15+
- Apple Developer account ($99/year): https://developer.apple.com
- An iPhone/iPad for testing (or Simulator)

### Steps

1. **Open in Xcode**
   ```
   Copy store-packages/ios/ to your Mac
   Open HomeBuddy.xcodeproj in Xcode
   ```

2. **Configure signing**
   - Select the HomeBuddy target
   - Signing & Capabilities tab
   - Select your Team (Apple Developer account)
   - Xcode will create/manage provisioning profiles automatically

3. **Update Bundle Identifier** (if needed)
   - Default is `app.replit.homebuddy`
   - Change if you prefer a different identifier (e.g., `com.yourname.homebuddy`)

4. **Test on device/simulator**
   - Select a device or simulator
   - Cmd+R to build and run
   - Verify the app loads, navigation works, login flows work

5. **Archive and upload**
   ```
   Product → Archive
   Window → Organizer → Distribute App → App Store Connect
   ```

6. **Submit in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Create a new app
   - Select the uploaded build
   - Fill in store listing
   - Submit for review

### Important: Apple Review Guidelines
Apple sometimes rejects thin WebView wrappers. To improve approval chances:
- The app already includes native features: custom loading indicator, offline error handling, native JS dialogs, external link handling, and back/forward swipe gestures
- In your review notes, emphasize these native features
- Mention the app is a PWA with native-enhanced experience
- If rejected, consider adding push notifications or other native features

### Store Listing Details
- **App name**: Home Buddy - Maintenance Planner
- **Subtitle**: AI Home Maintenance Assistant
- **Category**: Utilities (primary), Lifestyle (secondary)
- **Description**: Home Buddy builds a personalized maintenance schedule for your home. Upload inspection reports for AI-powered analysis, track 13+ system categories (HVAC, plumbing, roof, electrical, and more), get DIY safety ratings, and stay ahead of costly repairs. Free forever, no ads, no premium tier.
- **Keywords**: home maintenance, home repair, HVAC, plumbing, roof, inspection, DIY, home improvement, maintenance schedule, home care
- **Privacy URL**: https://home-buddy.replit.app/terms

---

## Screenshots Needed (All Stores)

You'll need screenshots for each store. Recommended:

| Platform | Sizes Required |
|----------|---------------|
| Google Play | Phone: 1080x1920, Tablet: 1200x1920 (7"), 1600x2560 (10") |
| Microsoft | 1366x768 minimum, recommended 2400x1200 |
| Apple | iPhone 6.7" (1290x2796), iPhone 6.1" (1179x2556), iPad 12.9" (2048x2732) |

**Recommended screenshots (5-8 per store):**
1. Landing/hero page
2. Dashboard with systems overview
3. Document analysis feature
4. Maintenance log
5. System details page
6. Circuit breaker panel map
7. AI chat assistant
8. Mobile-friendly responsive view

---

## Digital Asset Links (Android — Required)

For the Android TWA to work properly (no URL bar), you must host the `assetlinks.json` file at your domain.

Copy `store-packages/android/assetlinks.json` to be served at:
```
https://home-buddy.replit.app/.well-known/assetlinks.json
```

This can be done by placing it in `client/public/.well-known/assetlinks.json`.

---

## Post-Submission Checklist

- [ ] Google Play: assetlinks.json hosted and verified
- [ ] Google Play: Content rating questionnaire completed
- [ ] Google Play: Privacy policy URL added
- [ ] Microsoft: Publisher ID replaced in appxmanifest.xml
- [ ] Microsoft: Privacy policy URL added
- [ ] Apple: App Transport Security configured (already done in Info.plist)
- [ ] Apple: Encryption declaration set to NO (already done in Info.plist)
- [ ] Apple: Privacy policy URL added
- [ ] All: Screenshots captured and uploaded
- [ ] All: Store descriptions finalized
