# Pocket AI v1.2.4

Date: 2026-06-16

## Version

- App version: `1.2.4`
- Android `versionCode`: `39`

## Change Summary

- Moved the attachment menu above the composer row so attachment actions are not pressed against the Android navigation area.
- Increased the attachment button tap target and gave attachment actions a stable `56px` height.
- Kept the attachment menu in the existing composer structure without introducing a new Modal or bottom sheet dependency.
- Kept file/camera/image picking logic, pending attachment data flow, message sending, drawer gestures, model picker, Markdown rendering, and table/formula/code horizontal scrolling unchanged.

## Modified Files

- `App.tsx`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `README.md`
- `RELEASE_NOTES_v1.2.4.md`

## New Files

- `RELEASE_NOTES_v1.2.4.md`

## Test Results

- TypeScript: passed (`cmd /c node_modules\.bin\tsc.cmd --noEmit`)
- Smoke: passed (`cmd /c npm.cmd run smoke`)
- Release APK build: passed (`cmd /c gradlew.bat assembleRelease`)
- Install test: passed (`adb install -r ...\app-release.apk`)
- Manual device checklist: passed on connected Android device
  - Attachment menu opens above the composer row.
  - Camera, image, and file actions are visible with stable tap bounds.
  - The attachment `+` active state stays readable in dark mode and does not turn white.
  - Drawer, model picker, and settings page still open without a white screen.
  - Existing table/formula horizontal scroll nodes were still present after the change.
  - `adb reverse --list` and port `8081` checks showed no Metro runtime dependency.
  - Filtered logcat showed no `FATAL EXCEPTION` or `ReactNativeJS` crash.

## APK SHA256

- `8CBE1EEA2E85B84143BD9DAA8798821D971C977F100A12D850E126D3CA682F5C`

## Git Sync

- Synced to `E:\android\projects\ai-chat-pocket-git`.
