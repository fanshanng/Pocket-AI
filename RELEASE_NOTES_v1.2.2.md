# Pocket AI v1.2.2

Date: 2026-06-16

## Version

- App version: `1.2.2`
- Android `versionCode`: `37`

## Change Summary

- Added theme tokens for selected surfaces, selected borders, selected text, and strong action colors.
- Replaced a small set of active/selected UI colors in API profile chips, suggestion chips, model picker profile chips, and the drawer new-chat button with theme tokens.
- Replaced attachment menu icon hardcoded blue with `theme.primary`.
- Kept layout, drawer gestures, Markdown rendering, table/formula/code horizontal scrolling, and Modal structure unchanged.

## Modified Files

- `App.tsx`
- `src/theme.ts`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `README.md`
- `RELEASE_NOTES_v1.2.2.md`

## New Files

- `RELEASE_NOTES_v1.2.2.md`

## Test Results

- TypeScript: passed with `cmd /c node_modules\.bin\tsc.cmd --noEmit`.
- Smoke: passed with `cmd /c npm.cmd run smoke`.
- Release APK build: passed with `cmd /c gradlew.bat assembleRelease`.
- Install test: passed with `adb install -r android\app\build\outputs\apk\release\app-release.apk`, then launched `com.fanshanng.aichatpocket/.MainActivity`.
- Device checks: main chat screen, left drawer, settings from drawer, theme dark/light selected states, attachment menu, and model picker were checked on a connected Android device.
- Regression guard: no Metro reverse/8081 dependency was observed; filtered logcat showed no Pocket AI `FATAL EXCEPTION` or `ReactNativeJS` crash.
- Markdown/table/formula/code rendering was not changed in this version; those high-risk areas remain on the v1.2.1 baseline behavior.

## APK SHA256

- `874671F780467DCED915D91F49CCD153773CFD8275976D03A5536EB48B0233C0`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git` after verification.
