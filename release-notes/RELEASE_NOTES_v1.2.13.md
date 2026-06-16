# Pocket AI v1.2.13

Date: 2026-06-16

## Version

- App version: `1.2.13`
- Android `versionCode`: `48`

## Change Summary

- Simplified the pending image preview modal by removing the bottom `Close` and `Delete` buttons.
- Kept only the top-right `X` button as the preview exit action.
- Kept pending attachment chip deletion unchanged, so attachments can still be removed from the composer before sending.
- Left attachment sending, storage, drawer gestures, Markdown rendering, model picker, and the Android keyboard composer fix unchanged.

## Modified Files

- `App.tsx`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.13.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.13.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.13` and `versionCode=48`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual pending-image preview check passed: shared `中文附件测试.jpg` into the app, opened the pending image preview, and the UI tree showed one `关闭` button and zero `删除` buttons inside the preview modal.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `6EC54307A4C5ADB50ED28659AA014643B8C16BF41752A9045965F302F57D8922`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
