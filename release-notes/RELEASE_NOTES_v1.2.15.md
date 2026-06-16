# Pocket AI v1.2.15

Date: 2026-06-16

## Version

- App version: `1.2.15`
- Android `versionCode`: `50`

## Change Summary

- Added a small set of focused English audit comments around the recent attachment-size guard and shared-image handling code.
- Documented why attachment size errors are typed, why copied files are checked again after `copyAsync`, and why Android shared image URIs are deduplicated.
- Documented the UI boundary that turns structured attachment-size errors into localized messages.
- No runtime behavior, UI layout, attachment sending, Markdown rendering, drawer gestures, or model picker logic was intentionally changed.

## Modified Files

- `App.tsx`
- `src/lib/files.ts`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.15.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.15.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.15` and `versionCode=50`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK opened to the chat screen with the header, empty state, composer, and attachment button visible.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `8EF02AAF6A30481438C4D80BBE2EDDB1A95EFC3CAB4E9A7FE912AE3F928E5814`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
