# Pocket AI v1.2.27

Date: 2026-06-16

## Version

- App version: `1.2.27`
- Android `versionCode`: `62`

## Change Summary

- Reverted the v1.2.26 directional formula drag experiment after device testing showed vertical drags over formulas were still captured.
- Restored block formulas to the v1.2.25 eager horizontal-scroll behavior, which keeps long formula horizontal scrolling usable.
- Updated smoke guards to protect the restored formula horizontal-scroll baseline.
- Did not change formula parsing, KaTeX rendering, table rendering, code block rendering, drawer gestures, API requests, attachment behavior, or storage behavior.

## Modified Files

- `src/components/MarkdownRenderer.tsx`
- `scripts/smoke.mjs`
- `PROJECT_HANDOFF.md`
- `docs/ARCHITECTURE_PLAN.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.27.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.27` and `versionCode=62`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.

## APK SHA256

- `3BD63EEB2549A60929C63A93E2E254186ADAA558468EDBA44D8A921390E5B6A3`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
