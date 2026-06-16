# Pocket AI Handoff

This file is for starting a fresh Codex conversation without losing project context.

## Current State

- Workspace path: `E:\android\projects\ai-chat-pocket`
- Selective private Git folder: `E:\android\projects\ai-chat-pocket-git`
- App: Expo / React Native / TypeScript Android chat app
- Package: `com.fanshanng.aichatpocket`
- Main UI file: `App.tsx`
- Native Android project exists in `android/`
- When opening in Android Studio, open `E:\android\projects\ai-chat-pocket\android` and use the `Project` view if the Android view does not classify the Expo-generated Gradle layout cleanly.
- Current UI theme: white/light mobile AI chat
- Standalone APK workflow is preferred. Do not assume Metro or same-LAN development is needed for normal testing.
- Current public release target: GitHub Release APK, not Google Play.
- Current version: `1.2.16` / Android `versionCode 51`.
- Current release APK path: `E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk`.

## Recently Implemented

- Removed the large top dashboard-style header.
- Compact bottom composer similar to mobile ChatGPT/Gemini.
- White/light chat UI and message bubble styling.
- Settings page has an API configuration section.
- Multiple API profiles are supported.
- Each API profile has its own API key in SecureStore.
- In the API profile modal, `Done` saves the edited profile and applies it as the active chat backend automatically.
- API profile modal has a `Test connection` action that sends a tiny request to validate API key, Base URL, endpoint mode, and model.
- Settings explains where chat records are stored.
- Existing single-profile API data migrates into the default profile.
- API profiles now include an endpoint mode:
  - `responses` for OpenAI Responses API, appends `/responses`.
  - `chatCompletions` for DeepSeek/OpenAI-compatible Chat Completions, appends `/chat/completions`.
- DeepSeek preset uses `https://api.deepseek.com` and `deepseek-v4-flash`.
- Message copy success uses a blue filled check icon without a popup.
- Common LaTeX-style cryptography/math tokens such as `\times`, `\phi`, `\equiv`, `\mod`, `\oplus`, `\land`, `\Sigma_0`, `\ggg`, `cases`, and `aligned` render as readable symbols while copied text stays original.
- A small internal content plugin system now lives in `src/plugins/`. The bundled `latex-math` plugin handles the LaTeX/cryptography cleanup before message display.
- Credential-like text such as passwords, API keys, tokens, commands, paths, and URLs renders as a monospace horizontal block.
- Composer avoids Android keyboard overlap better with `KeyboardAvoidingView`.
- In-flight requests can be aborted by pressing the stop button.
- Assistant output streams into the active message in real time where the provider/runtime supports SSE streaming.
- Assistant replies can include downloaded image/document URL attachments when links appear in provider output.
- Android can receive images from the system share sheet and split-screen drag/drop; received image URIs are copied through the existing attachment pipeline into the pending composer queue.
- The left session drawer supports local search, rename, delete, and Markdown copy export.
- The chat screen opens the left session/settings drawer with a right swipe or the top-left menu button; the drawer closes back to chat with a left swipe.
- Settings is a full-screen page launched from the left drawer; swiping right on settings returns to the left drawer instead of chat.
- Settings language selection is an option-list style control and updates/persists immediately; settings no longer has bottom close/save actions.
- Settings includes a quiet About area with fanshanng GitHub/blog/email links.
- API profile reasoning effort chips only show common choices (`high`, `xhigh`); other valid values can be typed and are applied when recognized. Invalid typed values show a short inline warning.
- Common API errors are mapped into clearer user-facing tips for auth, model/endpoint mismatch, rate limits, timeout, network failure, and provider 5xx errors.
- Formal local release signing is configured. Release builds read local-only `android/keystore.properties`; current signing material is backed up in ignored `LOCAL_PRIVATE/signing/` and must never be uploaded.
- First app icon set has been generated from `assets/icon-source.png.jpg`. Both Expo `assets/` and native Android `android/app/src/main/res/` launcher/splash resources were updated.
- `RELEASE_CHECKLIST.md` documents the GitHub Release flow, APK hash/signature checks, smoke tests, and files that must never be uploaded.
- v1.2.1 is the current rollback baseline for drawer gestures, dark attachment menu styling, table/formula/code horizontal scrolling, settings return behavior, and long-press haptic feedback.
- v1.2.2 adds a first small theme-token cleanup for active/selected surfaces and strong action colors without changing layout, drawer gestures, or Markdown rendering.
- v1.2.3 tightens the model picker bottom sheet header, refetch button, active model row, and API profile chips without changing the sheet animation, Modal layering, drawer gestures, or Markdown rendering.
- v1.2.4 moves the attachment menu above the composer row and gives attachment actions a stable tap height so the menu is less likely to collide with Android navigation.
- v1.2.5 adds Markdown regression fixtures and smoke guards for long formulas, latex/math fenced formulas, wide tables, table inline math/code, regular code blocks, and intentionally unclosed streaming Markdown.
- v1.2.6 fixes the model picker bottom sheet spacing so the API profile chip rail keeps its own stable area and long model lists scroll below it without covering the API profile row.
- v1.2.7 adds Markdown/JSON copy export for single chat sessions and selected chat sessions. JSON export includes chat/message metadata and sanitized attachment metadata only, without API keys or local attachment file URIs.
- v1.2.8 extracts the existing drawer gesture thresholds and swipe decision helpers into `src/lib/drawerGestures.ts` and adds smoke guards, without changing PanResponder behavior, drawer open edge, Markdown horizontal scroll locking, or composer behavior.
- v1.2.9 adds attachment cache file-count and size statistics in Settings > Chat Storage with a manual refresh action, without changing attachment sending, export, drawer gestures, or clear-local-data behavior.
- v1.2.10 fixes attachment cache stats by showing both app-private cache-directory files and chat/pending attachment references, including message variant attachments, so Settings no longer reports only a misleading `0` when cached files are not discoverable.
- v1.2.11 improves pending attachment chips with original display names, type/size metadata, image thumbnails, and a pending image preview/delete modal while keeping storage paths ASCII-safe and attachment sending unchanged.
- v1.2.12 fixes the Android `+` attachment button tap target while the keyboard is open by lifting the composer with layout margin instead of transform-only movement.
- v1.2.13 simplifies the pending image preview modal so the top-right close button is the only preview action; attachment chip deletion remains on the chip itself.
- v1.2.14 adds clearer localized oversized-attachment prompts and cleans up copied files if the real copied size exceeds the attachment limit.
- v1.2.15 starts the audit-comment convention with focused English comments around recent attachment-size and shared-image edge cases; behavior is unchanged.
- v1.2.16 adds focused English audit comments and smoke protection around chat export privacy boundaries; export behavior is unchanged.

## Key Files

- `App.tsx`
  - App state, settings modals, API profile UI, chat screen, composer, request abort state, streaming text state.
- `src/types.ts`
  - `ApiProfile`, `PersistedState`, messages, conversations, attachments.
- `src/lib/storage.ts`
  - Encrypted persisted state.
  - Legacy API key migration.
  - Per-profile API key SecureStore helpers.
- `src/lib/openai.ts`
  - OpenAI Responses request construction and response parsing.
  - DeepSeek / Chat Completions request construction and response parsing.
  - Lightweight API connection test helper.
  - Shared API request error type with HTTP status metadata.
  - Accepts an optional `AbortSignal` so generation can be stopped.
  - Accepts `onTextDelta` for real-time streaming text updates.
  - Collects downloadable image/document URLs from assistant output and saves them as attachments.
- `src/lib/files.ts`
  - Attachment picking/copying/cleanup.
  - Remote URL attachment download helpers.
  - Shared Android image URI persistence helper.
- `src/components/MessageBubble.tsx`
  - Chat bubble, Markdown rendering, compact copy button, long-press copy.
  - Uses drawn copy/check icons instead of font-dependent symbols.
  - Detects credential-like / technical text and renders it as a monospace horizontal block.
- `src/plugins/`
  - Internal content plugin registry.
  - `latexMath.ts` transforms common LaTeX/math/cryptography tokens into readable symbols.
- `assets/`
  - App icon source and generated Expo icon/splash/favicon/adaptive icon assets.
  - `icon-source.png.jpg` is the current source image for regenerated icon assets.
- `RELEASE_CHECKLIST.md`
  - Per-release checklist for GitHub APK publishing.
- `release-notes/`
  - Per-version change/test records and GitHub Release page drafts. Add future `RELEASE_NOTES_vX.Y.Z.md` files here instead of the repository root.
- `android/app/src/main/java/com/fanshanng/aichatpocket/SharedImageModule.kt`
  - Native bridge for pending shared/dragged image URI events.
- `android/app/src/main/java/com/fanshanng/aichatpocket/MainActivity.kt`
  - Receives Android `SEND`, `SEND_MULTIPLE`, and root-view drag/drop image events.

## Persistence Details

- Encrypted state key: `ai-chat-pocket.state.v1`
- State encryption key: `ai-chat-pocket.state-encryption-key.v1`
- Legacy API key: `ai-chat-pocket.api-key.v1`
- Per-profile API key prefix: `ai-chat-pocket.api-key.profile.`
- Attachments are copied to app-private storage before being sent.
- Old API profiles without `apiProtocol` normalize to `responses`.

## API Profile Notes

DeepSeek example:

```text
Endpoint mode: Chat Completions compatible
Base URL: https://api.deepseek.com
Model: deepseek-v4-flash
Project ID: empty
Organization: empty
System prompt: You are a concise Chinese assistant. Answer with a short conclusion first, then examples.
```

OpenAI Responses example:

```text
Endpoint mode: OpenAI Responses
Base URL: https://api.openai.com/v1
Model: gpt-5.4
Project ID: optional OpenAI project id, e.g. proj_xxx
Organization: optional OpenAI organization id, e.g. org_xxx
System prompt: You are a careful coding assistant. Prefer practical, tested answers.
```

Project ID and Organization are OpenAI account/project routing headers and should usually stay empty for DeepSeek. System prompt is sent as a long-lived instruction with local conversation context.

## Next Optimization Queue

Recommended next tasks:

1. Split `App.tsx`.
   Extract `ChatScreen`, `Composer`, `SettingsModal`, `ApiProfilesModal`, `SessionsModal`, `useChatState`, and `useApiProfiles`.
2. Rich generated files.
   Add provider-specific image generation and PDF/DOCX export. Current support covers downloaded image/document URLs only.
3. Conversation management.
   Add pin, batch delete, import, and share-sheet export.
4. Context management.
   Add recent-message windows, automatic old-message summaries, and per-provider token/attachment limits.
5. Provider capability flags.
   Track whether a profile supports Responses chaining, images, files, system prompts, and thinking/reasoning parameters.
6. Security polish.
   Add app lock / biometric unlock and encrypted backup/restore.

## Validation Commands

TypeScript:

```powershell
cd E:\android\projects\ai-chat-pocket
cmd /c node_modules\.bin\tsc.cmd --noEmit
```

Build standalone release APK:

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
cmd /c gradlew.bat assembleRelease
```

Force rebuild native resources when icon/splash resources changed:

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
cmd /c gradlew.bat assembleRelease --rerun-tasks
```

Verify release APK signature:

```powershell
E:\android\.devtools\android-sdk\build-tools\36.1.0\apksigner.bat verify --print-certs E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk
```

Expected signing certificate SHA-256:

```text
9818729430986a531f0ac5e68b526dc019bc68a8320273306b6635436e939db1
```

Current v1.2.16 APK SHA-256:

```text
7AE867604116637E0C3D6FE3202FE644F75E96F01133DB9EF71017B81BD73067
```

Previous v1.2.15 APK SHA-256:

```text
8EF02AAF6A30481438C4D80BBE2EDDB1A95EFC3CAB4E9A7FE912AE3F928E5814
```

Previous v1.2.14 APK SHA-256:

```text
F87475F1E7427258EB06277DB69DE0982B7ADAD85CABF9615A11FE1E8033A4E0
```

Previous v1.2.13 APK SHA-256:

```text
6EC54307A4C5ADB50ED28659AA014643B8C16BF41752A9045965F302F57D8922
```

Previous v1.2.12 APK SHA-256:

```text
DB07822AFF75BCCD9AC23A896A83102ACA11012408C5167940369FBAC62184E3
```

Previous v1.2.11 APK SHA-256:

```text
7D0212B40F522B7B4B6D65A0B77E4006F7862EC831F445600ED5E70A9C19D6EF
```

Previous v1.2.10 APK SHA-256:

```text
70B59DFECAF467595B0B89AEB9A8AB7D8BB86192FD1EABA4379719AF2A25EBA0
```

Previous v1.2.9 APK SHA-256:

```text
1313FD78306A2F4583E1B4E80F2439E97764B3F9E7B7C1BBE37CDDD59CB36A5E
```

Previous v1.2.8 APK SHA-256:

```text
DFCB140200277A1F6A6F4B464F2BE2F89EB208EE0869E3F33A97AFFD9319B2F1
```

Previous v1.2.7 APK SHA-256:

```text
32076121620DF44505A32AE7554FB8C74F6974E2AD48750E88D9771C5E9E5356
```

Previous v1.2.6 APK SHA-256:

```text
88AB296F3869F7844E5CC19F13A2E34E48B7026F47DA13D129C474EF27AA4C50
```

Previous v1.2.5 APK SHA-256:

```text
C6154B7821A72533FB5AFB2ECE6EEDE03B84ADA22AB575E175C86110C96A1570
```

Previous v1.2.4 APK SHA-256:

```text
8CBE1EEA2E85B84143BD9DAA8798821D971C977F100A12D850E126D3CA682F5C
```

Previous v1.2.3 APK SHA-256:

```text
578EADA54C79F6E9FC00322485FCB57D9701DE1F7FD1751BEBE863F8D8A41BC5
```

Previous v1.2.2 APK SHA-256:

```text
874671F780467DCED915D91F49CCD153773CFD8275976D03A5536EB48B0233C0
```

Previous v1.2.1 APK SHA-256:

```text
Not built in the baseline-only v1.2.1 round.
```

Previous verified APK SHA-256 for v1.2.0:

```text
448A8F45C7D894FF463E1C9EEB000A38AD0E836C6C3DCDE2A549439AA4C82D3A
```

Install on connected Android device:

```powershell
cd E:\android\projects\ai-chat-pocket
adb install -r .\android\app\build\outputs\apk\release\app-release.apk
adb shell am start -n com.fanshanng.aichatpocket/.MainActivity
```

Check there is no Metro dependency:

```powershell
adb reverse --list
cmd /c netstat -ano | findstr :8081
```

## Upload Policy

This is intended as a closed-source/private repository.

Keep development in `E:\android\projects\ai-chat-pocket`. Use the sibling folder `E:\android\projects\ai-chat-pocket-git` for selective private GitHub upload. It should include source/config/docs/assets/native project files needed to rebuild, but exclude:

- `node_modules/`
- `.expo/`
- `dist/`
- `android/.gradle/`
- `android/.kotlin/`
- `android/build/`
- `android/app/build/`
- local logs/screenshots
- any `.env*` or real secrets
- `LOCAL_PRIVATE/`
- `android/keystore.properties`
- `android/keystore/`

When code changes are ready to publish privately, sync only the selected files from the development folder into the Git folder, then commit/push from `ai-chat-pocket-git`.

When reviewing or merging PRs, do not mirror-sync a full repository into the development folder. Preserve local-only files such as `LOCAL_PRIVATE/`, `android/keystore.properties`, signing backups, build caches, logs, screenshots, and user data.

## Known Warnings

- React Native warns that `SafeAreaView` is deprecated and recommends `react-native-safe-area-context`. This is not currently breaking.
- Android Gradle build requires Java 17+. This machine has used `D:\JAVA\jdk-21.0.2.13-hotspot`.
- Release APK signing uses local-only `android/keystore.properties` and ignored signing backups in `LOCAL_PRIVATE/signing/`. These files are intentionally ignored by Git and must be backed up offline.
- The Gradle wrapper may try to download Gradle when using `--rerun-tasks`; if the sandbox blocks network, rerun with approved escalation.
