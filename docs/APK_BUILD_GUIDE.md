# Build the Deadlock Android APK from GitHub

The v12 repository includes `.github/workflows/build-android-apk.yml`. GitHub can build a debug APK without requiring Android Studio on your phone or PC.

## After uploading v12

1. Open the `Galactic_Warfare-Deadlock` repository on GitHub.
2. Open **Actions**.
3. Select **Build Deadlock Android APK**.
4. Choose **Run workflow** on the `main` branch.
5. Wait for the `android-debug` job to finish.
6. Open the completed workflow run.
7. Under **Artifacts**, download **Deadlock-v12-debug-apk**.
8. Extract the downloaded ZIP. The installable file is `app-debug.apk`.
9. On Android, open the APK and allow installation from that source if Android asks.

This is a development/debug APK. A later release milestone can add a persistent signing key and automatic signed release APK/AAB builds.
