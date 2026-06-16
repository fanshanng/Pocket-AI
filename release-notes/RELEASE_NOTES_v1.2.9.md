# Pocket AI v1.2.9

Date: 2026-06-16

## Version

- App version: `1.2.9`
- Android `versionCode`: `44`

## Change Summary

- Added attachment cache file-count and size statistics.
- Added a refresh action in Settings > Chat Storage to reread attachment cache stats from app-private storage.
- Kept attachment picking/sending, chat export, Markdown rendering, drawer gestures, and clear-all-local-data behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/files.ts`
- `src/i18n/copy.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.9.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.9.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit`: passed.
- `cmd /c npm.cmd run smoke`: passed.
- `gradlew.bat assembleRelease`: passed.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk`: passed.
- Standalone APK launched without Metro: `adb reverse --list` returned empty and port `8081` had no listener.
- Manual device test passed: Settings opened from the left drawer.
- Manual device test passed: Settings > Chat Storage shows `Attachment cache`, the file-count/size line, and the refresh action.
- Manual device test passed: tapping refresh reread the attachment cache stats without white screen or error.
- `adb logcat` spot check found no app `FATAL EXCEPTION` or `ReactNativeJS` crash after the test flow.

## APK SHA256

- `1313FD78306A2F4583E1B4E80F2439E97764B3F9E7B7C1BBE37CDDD59CB36A5E`

## Git Sync

- Synced source records to `E:\android\projects\ai-chat-pocket-git`.
