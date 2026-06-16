# Pocket AI v1.2.6

Date: 2026-06-16

## Version

- App version: `1.2.6`
- Android `versionCode`: `41`

## Change Summary

- Fixed the model picker bottom sheet layout when many models are available.
- The API profile chip row now keeps a stable non-shrinking area, and the model list scrolls inside the remaining sheet height.
- Kept Markdown rendering, drawer gestures, attachment menu behavior, and model fetching logic unchanged.

## Modified Files

- `App.tsx`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `release-notes/RELEASE_NOTES_v1.2.6.md`

## New Files

- `release-notes/RELEASE_NOTES_v1.2.6.md`

## Test Results

- TypeScript: passed (`cmd /c node_modules\.bin\tsc.cmd --noEmit`)
- Smoke: passed (`cmd /c npm.cmd run smoke`)
- Release APK build: passed (`cmd /c gradlew.bat assembleRelease`)
- Install test: passed (`adb install -r ...\app-release.apk`)
- Manual device checklist: passed on connected Android device
  - Chat screen launched after installing the standalone release APK.
  - Existing formula and wide table messages still exposed `HorizontalScrollView` nodes.
  - Model picker opened and showed title, refetch button, API profile chips, and current model row.
  - API profile rail bounds stayed above the model list (`y=953..1170`, model list started at `y=1198` on the tested `1080x2248` device).
  - API profile horizontal swipe and model list vertical swipe both worked after the layout change.
  - `adb reverse --list` showed no Metro runtime dependency.
  - Filtered logcat showed no `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `88AB296F3869F7844E5CC19F13A2E34E48B7026F47DA13D129C474EF27AA4C50`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
- Local commit created for v1.2.6.
- Tag: not created.
- Push: not pushed.
