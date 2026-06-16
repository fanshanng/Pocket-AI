# Pocket AI v1.2.10

Date: 2026-06-16

## Version

- App version: `1.2.10`
- Android `versionCode`: `45`

## Change Summary

- Fixed attachment cache stats being misleading when the physical cache directory scan returns `0`.
- Settings > Chat Storage now shows both app-private cache files and attachments referenced by current chat records.
- Included message variant attachments and pending composer attachments in the referenced-attachment count.
- Kept attachment sending, attachment deletion, chat export, Markdown rendering, drawer gestures, and clear-local-data behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/files.ts`
- `src/lib/conversations.ts`
- `src/i18n/copy.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.10.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.10.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual settings check passed: Settings > Chat Storage shows `Attachment cache`, the refresh action, and separate cache-file/reference stats.
- Test device had no saved or pending attachments, so both counters correctly displayed `0`; the UI now separates physical cache files from chat attachment references.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `70B59DFECAF467595B0B89AEB9A8AB7D8BB86192FD1EABA4379719AF2A25EBA0`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
