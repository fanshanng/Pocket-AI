# Pocket AI v1.2.19

Date: 2026-06-16

## Version

- App version: `1.2.19`
- Android `versionCode`: `54`

## Change Summary

- Extracted the model picker header, refresh button, API profile chip rail, and model list into `src/components/ModelPickerContent.tsx`.
- Kept the existing bottom-sheet Modal, Animated values, sheet height, open/close behavior, model fetching, API profile switching, long-press profile editing, and model selection owned by `App.tsx`.
- Updated the architecture plan to mark the model picker presentational split as complete.
- No bottom-sheet behavior, profile state behavior, model fetching logic, drawer gestures, Markdown rendering, attachment behavior, API request logic, or storage behavior was intentionally changed.

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

- `src/components/ModelPickerContent.tsx`
- `release-notes/RELEASE_NOTES_v1.2.19.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.19` and `versionCode=54`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `EF185FD327AB08336599AD90ACC9358382CC3516C0F357C87DFDB8EFF1AA459C`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
