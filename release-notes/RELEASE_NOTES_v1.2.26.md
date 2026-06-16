# Pocket AI v1.2.26

Date: 2026-06-16

## Version

- App version: `1.2.26`
- Android `versionCode`: `61`

## Change Summary

- Replaced the eager block-formula horizontal-scroll wrapper with a formula-only directional drag layer.
- Long block formulas now only take over when the drag is clearly horizontal; vertical drags over a formula are left for the surrounding message list.
- Preserved formula parsing, KaTeX WebView rendering, measured formula width, table rendering, code block rendering, drawer gestures, API requests, attachment behavior, and storage behavior.
- Added smoke guards so formula blocks keep the directional horizontal-drag behavior and do not return to touch-start eager capture.

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

- `release-notes/RELEASE_NOTES_v1.2.26.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.26` and `versionCode=61`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.

## APK SHA256

- `BFDF485FB69E45AE6621E69FBB848F176FDAC1131367799992B065FCA5AF058D`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
