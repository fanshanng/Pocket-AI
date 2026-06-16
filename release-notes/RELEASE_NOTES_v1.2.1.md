# Pocket AI v1.2.1

Date: 2026-06-16

## Version

- App version: `1.2.1`
- Android `versionCode`: `36`
- Baseline: `v1.2.1`

## Change Summary

- Established the current usable state as the `v1.2.1` rollback baseline.
- Preserved the drawer behavior where the top-left menu and the left quarter edge swipe open the session drawer without covering the bottom composer.
- Preserved the fixed drawer close behavior so the drawer does not get stuck half open.
- Preserved dark-mode attachment menu styling so the `+` button stays themed instead of turning white.
- Preserved Markdown table horizontal scrolling with centered table cell text.
- Preserved long formula and code block horizontal scrolling behavior, including math fenced blocks rendered as formulas when appropriate.
- Preserved settings navigation behavior: settings opened from the drawer returns to the drawer, while other settings entries return to chat.
- Preserved vibration feedback for long-press actions on messages and session history items.

## Modified Files

- `App.tsx`
- `src/components/MarkdownRenderer.tsx`
- `src/components/MessageBubble.tsx`
- `src/lib/haptics.ts`
- `src/lib/releases.ts`
- `package.json`
- `package-lock.json`
- `app.json`
- `android/app/build.gradle`
- `PROJECT_HANDOFF.md`
- `README.md`
- `RELEASE_NOTES_v1.2.1.md`

## Test Results

- TypeScript: passed
  - `cmd /c node_modules\.bin\tsc.cmd --noEmit`
- Smoke: passed
  - `cmd /c npm.cmd run smoke`
- Manual device checklist: not run in this baseline-only round

## APK SHA256

- Release APK was not built in this baseline-only round.
- APK SHA256: `N/A`

## Notes

- No Metro/LAN runtime is required for normal installed-app usage.
- Do not upload `node_modules`, build outputs, `local.properties`, release/debug signing material, logs, user data, or APK files.
