# Pocket AI v1.2.7

Date: 2026-06-16

## Version

- App version: `1.2.7`
- Android `versionCode`: `42`

## Change Summary

- Added Markdown and JSON copy export actions to the long-press chat history menu.
- Added a selected-session export format picker so multiple sessions can be copied as Markdown or JSON.
- JSON export includes chat/message metadata and sanitized attachment metadata only; it does not export API keys or local attachment file URIs.
- Kept Markdown rendering, drawer gestures, model picker layout, attachment menu behavior, and message list behavior unchanged.

## Modified Files

- `App.tsx`
- `src/lib/conversations.ts`
- `src/i18n/copy.ts`
- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.7.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.7.md`

## Test Results

- `cmd /c node_modules\.bin\tsc.cmd --noEmit`: passed.
- `cmd /c npm.cmd run smoke`: passed.
- `gradlew.bat assembleRelease`: passed.
- `adb install -r android\app\build\outputs\apk\release\app-release.apk`: passed.
- Standalone APK launched without Metro: `adb reverse --list` returned empty and port `8081` had no listener.
- Manual device test passed: left drawer opened from the top-left menu button.
- Manual device test passed: selected-session export menu shows both `复制 Markdown` and `复制 JSON`, and `复制 JSON` shows the copied confirmation.
- Manual device test passed: long-press chat history menu still shows `置顶`, `重命名`, `复制 Markdown`, `复制 JSON`, and `删除`.
- Manual device spot check passed: existing Markdown test chat still shows wide table/formula content in the message area.
- `adb logcat` spot check found no app `FATAL EXCEPTION` or `ReactNativeJS` crash after the test flow.

## APK SHA256

- `32076121620DF44505A32AE7554FB8C74F6974E2AD48750E88D9771C5E9E5356`

## Git Sync

- Synced source records to `E:\android\projects\ai-chat-pocket-git`.
