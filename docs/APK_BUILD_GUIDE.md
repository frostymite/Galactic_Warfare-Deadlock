# Deadlock v13 — GitHub APK Build Guide

The repository includes `.github/workflows/build-android-apk.yml`. GitHub can build a debug APK without requiring Android Studio on your phone or PC.

## After uploading v13

1. Open the `Galactic_Warfare-Deadlock` repository on GitHub.
2. Open **Actions**.
3. Select **Build Deadlock Android APK**.
4. Choose **Run workflow** on the `main` branch.
5. Wait for the `android-debug` job to finish.
6. Open the completed workflow run.
7. Under **Artifacts**, download **Deadlock-v13-debug-apk**.
8. Extract the downloaded artifact ZIP; it contains `app-debug.apk`.
9. On Android, allow installation from the browser/file manager you are using if prompted, then install `app-debug.apk`.

## Important

- This produces a **debug APK**, suitable for testing on your own device. It is not a Play Store release build.
- Export a Deadlock campaign JSON before changing installation methods. The native build mirrors saves through Android Preferences, but backup/import remains the safest migration path.
- The workflow performs the actual Gradle/Android compile on GitHub. This development environment did not complete a local Capacitor dependency download, so no claim is made that the APK compile was locally verified.
