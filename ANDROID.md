# Deadlock Tactical OS v4 — Android

## Recommended: install as a PWA
For the most reliable Android experience:
1. Host this folder on an HTTPS site.
2. Open the site in Chrome on Android.
3. Tap **Install App** in the top controls, or Chrome → **Add to Home screen / Install app**.
4. Launch **Deadlock OS** from the home screen.

After the first successful load, the service worker caches the dashboard for offline use.

## Android-specific v4 features
- Large touch targets
- Bottom-navigation layout on narrow phones
- Automatic side-rail layout on larger/foldable screens
- Safe-area padding for notches and foldable displays
- Haptic taps when supported
- **Immersive** fullscreen control
- **Keep Awake** Screen Wake Lock control
- Generated UI audio with a Sound On/Off toggle
- Offline caching
- Local autosave
- JSON campaign backup import/export

## If Install App does not appear
Chrome only exposes the install prompt when the PWA requirements are satisfied. Use:
Chrome menu → **Add to Home screen** or **Install app**.

Local `file://` opening is fine for inspecting files, but service-worker installation/offline mode requires HTTPS or localhost.

## Native APK/AAB route
The project remains Capacitor-ready. Building a real APK/AAB requires Node.js, Android Studio, and the Android SDK on a computer.

Typical setup:

    npm run android:init
    npm run android:sync
    npm run android:open

Then build and sign the APK/AAB from Android Studio.

The PWA route requires no APK compilation and is the easiest way to use the full interface on an Android phone.
