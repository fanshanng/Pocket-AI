# Pocket AI v1.2.25

Date: 2026-06-16

## Version

- App version: `1.2.25`
- Android `versionCode`: `60`

## Change Summary

- Reverted the v1.2.24 formula scroll experiment after device testing showed formulas lost horizontal scrolling and still blocked vertical scrolling.
- Restored the v1.2.23 eager formula horizontal-scroll wrapper for block formulas.
- Updated smoke guards so formula blocks keep the known v1.2.23 horizontal-scroll behavior.
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

- `release-notes/RELEASE_NOTES_v1.2.25.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files, with only existing LF/CRLF working-copy warnings.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.25` and `versionCode=60`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.
- `cmd /c npm.cmd run release:audit` passed after syncing the selected files to `E:\android\projects\ai-chat-pocket-git`.

## APK SHA256

- `8232D523A26E891D727EC67C75CC5984A9F8B575B2D7B882D60F6AEEF77DA4BD`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
