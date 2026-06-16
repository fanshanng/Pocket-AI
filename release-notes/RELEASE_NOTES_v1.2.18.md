# Pocket AI v1.2.18

Date: 2026-06-16

## Version

- App version: `1.2.18`
- Android `versionCode`: `53`

## Change Summary

- Extracted the pending attachment chip rail into `src/components/PendingAttachmentBar.tsx`.
- Kept attachment state, preview opening, removal, sending, file copying, cache statistics, and size validation owned by the existing `App.tsx` flow.
- Updated the architecture plan to mark `PendingAttachmentBar` as the first low-risk presentational split from `App.tsx`.
- No attachment behavior, attachment menu behavior, composer keyboard handling, drawer gestures, Markdown rendering, API request logic, or storage behavior was intentionally changed.

## Modified Files

- `App.tsx`
- `docs/ARCHITECTURE_PLAN.md`
- `PROJECT_HANDOFF.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `src/components/PendingAttachmentBar.tsx`
- `release-notes/RELEASE_NOTES_v1.2.18.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.18` and `versionCode=53`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `EA483297B43BC0AA644064E8A1173C36F25D4F0F3A7F48618AEE9CA90BFDB416`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
