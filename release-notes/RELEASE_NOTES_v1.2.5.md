# Pocket AI v1.2.5

Date: 2026-06-16

## Version

- App version: `1.2.5`
- Android `versionCode`: `40`

## Change Summary

- Added a Markdown regression fixture covering long block formulas, latex/math fenced formulas, wide tables, table inline math/code, regular code blocks, intentionally unclosed code fences, and intentionally unclosed inline math.
- Extended `npm run smoke` with source guards for the current Markdown rendering paths:
  - unclosed streaming code fence normalization
  - latex/tex/math fenced code rendered as formula blocks when it looks like math
  - table horizontal scrolling with estimated width
  - centered table cell text
  - formula horizontal scrolling
  - code block Copy / Fullscreen actions
  - drawer gesture locking around Markdown/code horizontal scroll
- Kept `MarkdownRenderer`, `MessageBubble`, `CodeBlock`, drawer gestures, attachment menu, model picker UI, and actual rendering behavior unchanged.

## Modified Files

- `scripts/smoke.mjs`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.5.md`

## New Files

- `scripts/fixtures/markdown-regression.md`
- `release-notes/RELEASE_NOTES_v1.2.5.md`

## Test Results

- TypeScript: passed (`cmd /c node_modules\.bin\tsc.cmd --noEmit`)
- Smoke: passed (`cmd /c npm.cmd run smoke`)
- Release APK build: passed (`cmd /c gradlew.bat assembleRelease`)
- Install test: passed (`adb install -r ...\app-release.apk`)
- Manual device checklist: passed on connected Android device
  - Chat screen launched after installing the standalone release APK.
  - Existing formula and wide table messages still exposed `HorizontalScrollView` nodes.
  - Model picker opened and showed title, refetch button, API profile chips, and current model row.
  - Left drawer opened and showed chat history/settings controls.
  - Settings opened from the drawer and showed API, storage, language, theme, and about rows.
  - Attachment `+` / camera path was still triggerable and entered the system camera; attachment rendering code was not changed in this version.
  - `adb reverse --list` and port `8081` checks showed no Metro runtime dependency.
  - Filtered logcat showed no `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `C6154B7821A72533FB5AFB2ECE6EEDE03B84ADA22AB575E175C86110C96A1570`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
