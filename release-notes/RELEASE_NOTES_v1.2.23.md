# Pocket AI v1.2.23

Date: 2026-06-16

## Version

- App version: `1.2.23`
- Android `versionCode`: `58`

## Change Summary

- Added `scripts/release-audit.mjs` for final release consistency checks.
- Added `npm run release:audit` to verify current version alignment, current release note completeness, README cleanliness, upload-folder forbidden files, and 1.3.0 planning visibility.
- Added smoke guards so the release audit entry point and core checks stay wired.
- Updated the architecture plan and handoff to mark this as the final 1.2-series release-audit step before publishing the latest stable build as v1.3.0.
- No runtime UI, API request construction, drawer gestures, Markdown rendering, attachment behavior, or storage encryption behavior was intentionally changed.

## Modified Files

- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `scripts/smoke.mjs`
- `PROJECT_HANDOFF.md`
- `docs/ARCHITECTURE_PLAN.md`
- `src/lib/releases.ts`

## New Files

- `scripts/release-audit.mjs`
- `release-notes/RELEASE_NOTES_v1.2.23.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files, with only existing LF/CRLF working-copy warnings.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.23` and `versionCode=58`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.
- `cmd /c npm.cmd run release:audit` passed after syncing the selected files to `E:\android\projects\ai-chat-pocket-git`.

## APK SHA256

- `7F0F5366593612BBECD745F82887D010545A6D7F49B2A93BDB50AE206E336E6D`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
