# Pocket AI v1.2.20

Date: 2026-06-16

## Version

- App version: `1.2.20`
- Android `versionCode`: `55`

## Change Summary

- Fixed API Base URL editing so clearing a preset URL no longer immediately restores the default URL while the user is replacing it.
- Auto-save now skips profile persistence while the draft Base URL is temporarily empty.
- Test connection, model fetching, and explicit save still require a non-empty Base URL and show a localized prompt.
- Preset selection and normal saved-profile sanitization are unchanged.
- No API request construction, model picker layout, drawer gestures, Markdown rendering, attachment behavior, or storage encryption behavior was intentionally changed.

## Modified Files

- `App.tsx`
- `src/i18n/copy.ts`
- `scripts/smoke.mjs`
- `docs/ARCHITECTURE_PLAN.md`
- `PROJECT_HANDOFF.md`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.20.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit` passed.
- `cmd /c npm.cmd run smoke` passed.
- `git diff --check` passed for the changed files.
- `cmd /c gradlew.bat assembleRelease` passed with `JAVA_HOME=D:\JAVA\jdk-21.0.2.13-hotspot` and `NODE_ENV=production`.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk` passed.
- Installed app reported `versionName=1.2.20` and `versionCode=55`.
- Standalone APK check passed: `adb reverse --list` was empty and port `8081` had no listener.
- Manual launch smoke passed: the installed release APK started `com.fanshanng.aichatpocket/.MainActivity`.
- Recent logcat scan found no app `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `3D82EEAFEDAB29FE889FD267D6C5B7CA409C30B0C8A468A8E77659EAC414EC96`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
