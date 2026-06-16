# Pocket AI v1.2.24

Date: 2026-06-16

## Version

- App version: `1.2.24`
- Android `versionCode`: `59`

## Change Summary

- Changed block formulas to use the same `HorizontalScrollable` gesture strategy as Markdown tables.
- Removed the eager formula horizontal-scroll wrapper that activated on touch start and could block vertical message-list scrolling.
- Added smoke guards so formula blocks keep table-style horizontal scroll behavior and do not reintroduce eager vertical-drag capture.
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

- `release-notes/RELEASE_NOTES_v1.2.24.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files, with only existing LF/CRLF working-copy warnings.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.24` and `versionCode=59`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.
- Manual device follow-up: verify vertical scrolling over long formulas and horizontal scrolling inside long formulas.

## APK SHA256

- `D564858352D2C1692AFEC5DCC30868ADD6293D44B5AE21654C56D1B50FC37799`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
