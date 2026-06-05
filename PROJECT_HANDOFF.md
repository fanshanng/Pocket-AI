# Pocket AI Handoff

This file is for starting a fresh Codex conversation without losing project context.

## Current State

- Workspace path: `E:\android\projects\ai-chat-pocket`
- Selective private Git folder: `E:\android\projects\ai-chat-pocket-git`
- App: Expo / React Native / TypeScript Android chat app
- Package: `com.fanshanng.aichatpocket`
- Main UI file: `App.tsx`
- Native Android project exists in `android/`
- Current UI theme: white/light mobile AI chat
- Standalone APK workflow is preferred. Do not assume Metro or same-LAN development is needed for normal testing.

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
- The sessions modal supports local search, rename, delete, and Markdown copy export.
- The sessions and settings modals close by tapping the dimmed backdrop; the sessions modal no longer has a bottom `Done` button.
- Settings language selection is an option-list style control and updates/persists immediately; settings no longer has bottom close/save actions.
- Settings includes a quiet About area with fanshanng GitHub/blog/email links.
- Settings/API/session modals use a separate dimmed dismiss area above the card so Android vertical scrolling inside the card is less likely to be stolen by the backdrop.
- API profile reasoning effort chips only show common choices (`high`, `xhigh`); other valid values can be typed and are applied when recognized. Invalid typed values show a short inline warning.
- Common API errors are mapped into clearer user-facing tips for auth, model/endpoint mismatch, rate limits, timeout, network failure, and provider 5xx errors.

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
   Add app lock / biometric unlock, encrypted backup/restore, and real release signing before final distribution.

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

When code changes are ready to publish privately, sync only the selected files from the development folder into the Git folder, then commit/push from `ai-chat-pocket-git`.

## Known Warnings

- React Native warns that `SafeAreaView` is deprecated and recommends `react-native-safe-area-context`. This is not currently breaking.
- Android Gradle build requires Java 17+. This machine has used `D:\JAVA\jdk-21.0.2.13-hotspot`.
