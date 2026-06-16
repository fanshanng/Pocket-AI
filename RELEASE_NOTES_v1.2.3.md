# Pocket AI v1.2.3

Date: 2026-06-16

## Version

- App version: `1.2.3`
- Android `versionCode`: `38`

## Change Summary

- Tightened the model picker bottom sheet header so the title and refetch button keep stable widths on narrow screens.
- Added a refresh icon to the model refetch action and constrained its label to avoid overlap.
- Adjusted model picker API profile chips with local min/max widths and one-line title/meta text.
- Reused selected theme text for the active model row.
- Kept Modal layering, bottom sheet animation, drawer gestures, attachment menu, Markdown rendering, table/formula/code horizontal scrolling, and message list behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `README.md`
- `RELEASE_NOTES_v1.2.3.md`

## New Files

- `RELEASE_NOTES_v1.2.3.md`

## Test Results

- TypeScript: passed with `cmd /c node_modules\.bin\tsc.cmd --noEmit`.
- Smoke: passed with `cmd /c npm.cmd run smoke`.
- Release APK build: passed with `cmd /c gradlew.bat assembleRelease`.
- Install test: passed with `adb install -r E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk`, then launched `com.fanshanng.aichatpocket/.MainActivity`.
- Device checks: model picker title/refetch button/profile chips/active model row, drawer menu button, left-quarter swipe drawer opening, settings from drawer, and attachment menu were checked on a connected Android device.
- Regression guard: no Metro reverse/8081 dependency was observed; filtered logcat showed no Pocket AI `FATAL EXCEPTION` or `ReactNativeJS` crash.
- Markdown/table/formula/code rendering was not changed in this version; those high-risk areas remain on the v1.2.1 baseline behavior.

## APK SHA256

- `578EADA54C79F6E9FC00322485FCB57D9701DE1F7FD1751BEBE863F8D8A41BC5`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git` after verification.
