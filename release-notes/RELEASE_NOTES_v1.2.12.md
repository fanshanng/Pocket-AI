# Pocket AI v1.2.12

Date: 2026-06-16

## Version

- App version: `1.2.12`
- Android `versionCode`: `47`

## Change Summary

- Fixed the bottom `+` attachment button becoming untappable while the Android keyboard is open.
- Android now lifts the composer with layout margin instead of transform-only movement, keeping visual position and tap hit area aligned.
- Kept attachment sending, pending attachment preview, drawer gestures, Markdown rendering, model picker, and chat export behavior unchanged.

## Modified Files

- `App.tsx`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.12.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.12.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual keyboard/composer check passed: focused the bottom input to open the Android keyboard, tapped the bottom `+`, and the attachment menu opened with `拍照` / `图片` / `文件`.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `DB07822AFF75BCCD9AC23A896A83102ACA11012408C5167940369FBAC62184E3`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
