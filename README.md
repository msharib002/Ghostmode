# Ghost Mode 👻

Native Kotlin Android MVP: Usage Access onboarding, local daily usage summary, recent app timeline, simple same-hour 7-day prediction, manual Ghost notification, privacy screen. No internet permission or account.

## Build
Open this folder as an Android Gradle project in Android Studio or a compatible cloud Android build environment. Install JDK 17 and Android SDK 35, then run `gradle :app:assembleDebug`. APK output: `app/build/outputs/apk/debug/app-debug.apk`. Android Studio can install its own Gradle distribution; this archive has no Gradle wrapper.

Grant Usage Access through Settings when prompted. On Android 13+, allow notifications. Android may limit historical usage/event retention. Prediction needs previous usage history. Notification is manual; no background scheduling in this MVP. Usage durations come from Android's daily UsageStats buckets, so the current day's boundary may vary on some devices.
