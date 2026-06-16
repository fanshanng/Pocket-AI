# Pocket AI v1.3.0

Date: 2026-06-16

## Version

- App version: `1.3.0`
- Android `versionCode`: `63`

## Change Summary

- Published the latest v1.2.27 stable behavior as the next minor release.
- This is a release packaging/version update only; runtime chat behavior is unchanged from v1.2.27.
- Preserved drawer behavior, composer tap targets, dark attachment menu styling, table/formula/code rendering behavior, settings return behavior, long-press haptics, API requests, attachment behavior, storage behavior, and release audit checks.
- Kept formula vertical-drag improvement out of v1.3.0 after the v1.2.24 and v1.2.26 experiments failed device testing; it remains a future low-risk prototype task.

## Modified Files

- `PROJECT_HANDOFF.md`
- `docs/ARCHITECTURE_PLAN.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `release-notes/RELEASE_NOTES_v1.3.0.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.3.0` and `versionCode=63`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION`; the only `ReactNativeJS` line was the known `SafeAreaView` deprecation warning.

## APK SHA256

- `F6F0CF302C7AEBC665779BE95AC62DBA2DAB2C9A1CA2041FB1738C40506849F9`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
