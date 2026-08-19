# Android APK & AAB Building Guide for Finance by Pooja

This project includes PWA Web Manifest (`manifest.json`), Offline Service Worker (`sw.js`), and Capacitor Android configuration (`capacitor.config.json`) ready for generating `.apk` and `.aab` Android build packages.

---

## 📱 Option 1: Instant PWA to APK / AAB (No Android Studio required)

1. Host the project online (or run localtunnel/ngrok: `npx localtunnel --port 3000`).
2. Go to **[PWABuilder.com](https://www.pwabuilder.com)**.
3. Enter your web app URL.
4. Click **Package for Android**.
5. PWABuilder automatically compiles and downloads:
   - **`app-release-signed.apk`**: Direct installation file for Android phones.
   - **`app-release.aab`**: Google Play Store submission bundle.

---

## 🛠️ Option 2: Native Android Studio Build (Capacitor)

Once Node.js and Android Studio are installed on your machine:

1. Open your terminal in `c:\Users\rella\OneDrive\Desktop\fm`.
2. Install Capacitor packages:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
3. Add the Android platform:
   ```bash
   npx cap add android
   npx cap copy android
   ```
4. Open the native Android project in Android Studio:
   ```bash
   npx cap open android
   ```
5. In Android Studio:
   - For testing `.apk`: Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - For Play Store `.aab`: Go to **Build > Generate Signed Bundle / APK > Android App Bundle (.aab)**.
