# Pocket AI v1.2.14

Date: 2026-06-16

## Version

- App version: `1.2.14`
- Android `versionCode`: `49`

## Change Summary

- Added a clearer localized oversized-attachment prompt for images, camera captures, shared images, and picked files.
- Kept the existing `8 MB` attachment limit, but now reports the selected file name, real size, and limit in the app language.
- Added a second size check after copying files into app-private storage, so unknown-size attachments are cleaned up if their real copied size is too large.
- Left attachment sending, pending attachment chips, image preview, drawer gestures, Markdown rendering, model picker, and Android keyboard composer behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/files.ts`
- `src/i18n/copy.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.14.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.14.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.14` and `versionCode=49`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual normal attachment check passed: shared `中文附件测试.jpg` into the app and the pending chip showed `IMAGE · 34.4 KB` plus the original Chinese file name.
- Manual oversized-image check passed: shared `large-image-test.bmp` through a MediaStore `content://` URI, and the app showed `附件过大` with the file name, `12.0 MB` size, and `8.0 MB` limit.
- Manual cleanup check passed: after dismissing the oversized attachment alert, the oversized image was not left in the pending attachment rail.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `F87475F1E7427258EB06277DB69DE0982B7ADAD85CABF9615A11FE1E8033A4E0`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
