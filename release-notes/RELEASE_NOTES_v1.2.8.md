# Pocket AI v1.2.8

Date: 2026-06-16

## Version

- App version: `1.2.8`
- Android `versionCode`: `43`

## Change Summary

- Extracted the existing drawer gesture thresholds and swipe decision helpers into `src/lib/drawerGestures.ts`.
- Kept the current PanResponder drawer implementation, open-edge width, close-swipe threshold, settings return swipe threshold, Markdown/table/formula/code horizontal gesture lock, and composer behavior unchanged.
- Added smoke guards for drawer open-edge fraction, swipe thresholds, centralized drawer gesture strategy usage, and horizontal gesture lock wiring.

## Modified Files

- `App.tsx`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.8.md`

## New Files

- `src/lib/drawerGestures.ts`
- `release-notes/RELEASE_NOTES_v1.2.8.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit`: passed.
- `cmd /c npm.cmd run smoke`: passed.
- `gradlew.bat assembleRelease`: passed.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk`: passed.
- Standalone APK launched without Metro: `adb reverse --list` returned empty and port `8081` had no listener.
- Manual device test passed: top-left menu button opened the left chat drawer.
- Manual device test passed: left drawer closed with a left swipe and reopened from the left-side quarter gesture area when starting away from the system edge.
- Manual device test passed: bottom `+` still opened the attachment menu with camera/image/file actions.
- Manual device test passed: wide Markdown table remained horizontally scrollable and did not trigger the drawer while swiping inside the table.
- Manual device test passed: code block still showed `Copy` and fullscreen actions.
- `adb logcat` spot check found no app `FATAL EXCEPTION` or `ReactNativeJS` crash after the test flow.

## APK SHA256

- `DFCB140200277A1F6A6F4B464F2BE2F89EB208EE0869E3F33A97AFFD9319B2F1`

## Git Sync

- Synced source records to `E:\android\projects\ai-chat-pocket-git`.
