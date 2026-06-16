# Pocket AI v1.2.21

Date: 2026-06-16

## Version

- App version: `1.2.21`
- Android `versionCode`: `56`

## Change Summary

- Extracted editable API profile draft helpers into `src/lib/profileDrafts.ts`.
- Centralized the guard that allows a Base URL draft to be temporarily empty while users replace a preset URL.
- Centralized editable draft sanitization so future API configuration extraction can reuse the same behavior outside `App.tsx`.
- Added smoke guards for the helper exports and temporary-empty Base URL behavior.
- No API request construction, model picker layout, drawer gestures, Markdown rendering, attachment behavior, or storage encryption behavior was intentionally changed.

## Modified Files

- `App.tsx`
- `scripts/smoke.mjs`
- `docs/ARCHITECTURE_PLAN.md`
- `PROJECT_HANDOFF.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `src/lib/profileDrafts.ts`
- `release-notes/RELEASE_NOTES_v1.2.21.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files, with only existing LF/CRLF working-copy warnings.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.21` and `versionCode=56`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.

## APK SHA256

- `5267DD35DD44520C2A80BCA5199A03AC9B15666226C7CAB4D46CB6034FA32F98`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
