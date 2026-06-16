# Pocket AI v1.2.16

Date: 2026-06-16

## Version

- App version: `1.2.16`
- Android `versionCode`: `51`

## Change Summary

- Added focused English audit comments around chat export privacy boundaries.
- Documented that exported attachments keep only portable metadata and must not include local file URIs.
- Documented why provider routing, API profiles, API keys, and local response-chain state stay out of chat backups.
- Added a smoke guard so the export privacy audit comment is not accidentally removed.
- No runtime behavior, UI layout, export output shape, attachment sending, Markdown rendering, drawer gestures, or model picker logic was intentionally changed.

## Modified Files

- `src/lib/conversations.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.16.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.16.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.16` and `versionCode=51`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK opened to the chat screen with the header, empty state, composer, and attachment button visible.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `7AE867604116637E0C3D6FE3202FE644F75E96F01133DB9EF71017B81BD73067`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
