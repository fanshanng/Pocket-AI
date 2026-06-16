# Pocket AI v1.2.11

Date: 2026-06-16

## Version

- App version: `1.2.11`
- Android `versionCode`: `46`

## Change Summary

- Preserved original attachment display names, including Chinese file names, while keeping copied storage paths ASCII-safe.
- Improved pending attachment chips with stable sizing, file type, file size, and image thumbnails.
- Added a pending image preview modal with close and delete actions.
- Kept attachment sending, Markdown rendering, drawer gestures, model picker, chat export, and cache clearing behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/files.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.11.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.11.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch check passed: the chat screen opened from the installed release APK.
- Manual attachment check passed using Android `ACTION_SEND` with `content://media/external/images/media/1668`: pending chip showed `IMAGE`, thumbnail, delete button, and original Chinese file name `中文附件测试.jpg`.
- Manual image preview check passed: tapping the pending image opened a preview modal with the Chinese title, image area, close action, and delete action.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `7D0212B40F522B7B4B6D65A0B77E4006F7862EC831F445600ED5E70A9C19D6EF`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
