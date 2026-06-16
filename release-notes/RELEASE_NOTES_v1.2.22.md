# Pocket AI v1.2.22

Date: 2026-06-16

## Version

- App version: `1.2.22`
- Android `versionCode`: `57`

## Change Summary

- Added `src/lib/providerCapabilities.ts` with typed provider capability metadata.
- Added default capability inference for Responses and Chat Completions profiles.
- Tracked current support for response chaining, streaming, native image/file attachments, system prompts, reasoning, and future web search eligibility.
- Kept `supportsWebSearch` disabled by default until a later version adds explicit profile UI and request payload support.
- Added smoke guards for the capability module.
- No API request construction, model picker layout, drawer gestures, Markdown rendering, attachment behavior, or storage encryption behavior was intentionally changed.

## Modified Files

- `scripts/smoke.mjs`
- `docs/ARCHITECTURE_PLAN.md`
- `PROJECT_HANDOFF.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `src/lib/providerCapabilities.ts`
- `release-notes/RELEASE_NOTES_v1.2.22.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files, with only existing LF/CRLF working-copy warnings.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.22` and `versionCode=57`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.

## APK SHA256

- `C72FF948C5D988BC276835083507E119DF396453F361E8EA5A8A4968590FB103`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
