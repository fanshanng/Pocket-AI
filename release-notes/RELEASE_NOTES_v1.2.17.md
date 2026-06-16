# Pocket AI v1.2.17

Date: 2026-06-16

## Version

- App version: `1.2.17`
- Android `versionCode`: `52`

## Change Summary

- Refreshed the public README with a concise app description, usage flow, local-first data note, and links to the version notes and architecture plan.
- Added `docs/ARCHITECTURE_PLAN.md` as the living architecture map for future framework work.
- Documented current module responsibilities, stable baseline boundaries, refactor rules, target layers, provider capability planning, rendering stability rules, and the suggested next version queue.
- Updated `PROJECT_HANDOFF.md` to point future Codex sessions at the architecture plan.
- No runtime behavior, UI layout, API request logic, attachment behavior, Markdown rendering, drawer gestures, or storage behavior was intentionally changed.

## Modified Files

- `README.md`
- `PROJECT_HANDOFF.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `docs/ARCHITECTURE_PLAN.md`
- `release-notes/RELEASE_NOTES_v1.2.17.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.17` and `versionCode=52`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `FC37B9508A5B07EE694BD6520E66CB31AB6BC5DADAF1E3B687F6C0C691445D5F`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
