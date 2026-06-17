# Pocket AI Architecture Plan

This document keeps the long-term architecture direction visible without mixing large refactors into feature releases.

## Current Shape

- `App.tsx` is the main application shell and still owns most screen state, modals, drawer gestures, composer behavior, API profile editing, model picking, session management, sending, editing, regeneration, streaming, and attachment entry points.
- `src/components/MarkdownRenderer.tsx`, `src/components/MessageBubble.tsx`, and `src/components/CodeBlock.tsx` are high-risk rendering components. Table scrolling, formula scrolling, code display, full-screen code, long-press menus, and drawer gesture locking can affect each other.
- `src/lib/openai.ts` contains provider request construction, streaming parsing, model fetching, connection testing, title generation, and assistant attachment collection.
- `src/lib/files.ts` owns attachment picking, copying, size validation, cache statistics, cleanup, and shared-image persistence.
- `src/lib/storage.ts` owns encrypted persisted state and SecureStore API key helpers.
- `src/lib/conversations.ts` owns conversation creation, sorting, searching, attachment collection, and Markdown/JSON export formatting.
- `release-notes/` is the local-only per-version audit trail. It is ignored in the upload folder; public release summaries should be written on GitHub Release pages.

## Stable Baseline

`v1.2.1` remains the rollback baseline for drawer gestures, composer tap targets, dark attachment menu styling, table/formula/code horizontal scrolling, settings return behavior, and long-press haptic feedback.

Current version: `v1.3.10`.

## Refactor Rules

- Change one low-coupling direction per patch version.
- Do not mix gesture, Markdown, composer, and bottom-sheet rewrites in one version.
- Prefer extracting existing behavior before changing behavior.
- Add focused English comments near non-obvious boundaries, especially privacy, platform quirks, gesture arbitration, and export/import compatibility.
- Keep behavior-preserving extractions guarded by `tsc`, `smoke`, and targeted manual testing.
- If a new abstraction makes a stable interaction worse, stop and keep the previous stable version.

## Target Layers

### 1. App Shell

Move screen composition out of `App.tsx` gradually:

- `ChatScreen`
- `Composer`
- `SessionDrawer`
- `SettingsScreen`
- `ModelPickerSheet`
- `AttachmentMenu`
- `PendingAttachmentBar`

Start with pure presentational extractions that receive state and callbacks from `App.tsx`.

### 2. State Hooks

Extract hooks only after the matching UI area is stable:

- `useApiProfiles`
- `useModelPicker`
- `useAttachmentPicker`
- `useAttachmentCache`
- `useConversationExport`
- `useSessionDrawer`

The send/regenerate/edit chain should be extracted later because it touches streaming, persistence, attachments, variants, and title generation.

### 3. Provider Capabilities

Introduce provider capability metadata before adding provider-specific features:

- `supportsResponses`
- `supportsChatCompletions`
- `supportsStreaming`
- `supportsImages`
- `supportsFiles`
- `supportsReasoning`
- `supportsWebSearch`

Future network search should use this layer and should be configurable per API profile. The UI can default it on only when the selected profile supports it.

### 4. Shared UI Components

Build small components as local patterns become repeated:

- `IconButton`
- `PrimaryButton`
- `GhostButton`
- `TextField`
- `Card`
- `SectionHeader`
- `BottomSheetFrame`

Replace one local area at a time and verify both light and dark mode.

### 5. Rendering Stability

Keep Markdown changes small and test-driven:

- Preserve table horizontal scrolling and centered table text.
- Preserve long formula horizontal scrolling.
- Preserve code block copy and full-screen code behavior.
- Keep fenced `latex`, `tex`, and `math` formula handling.
- Add fixtures before changing parser or renderer behavior.

### 6. Data Safety

Prefer explicit import/export boundaries:

- JSON chat import with schema-version checks.
- Markdown and JSON share/export flows.
- Config export with API keys hidden by default.
- Attachment cache cleanup and size reporting.
- Later: encrypted backup/restore and optional app lock.

## Suggested Version Queue

- `v1.2.18`: Extracted `PendingAttachmentBar` as the first low-risk presentational split from `App.tsx`.
- `v1.2.19`: Extracted `ModelPickerContent` while keeping bottom-sheet animation and model/profile state in `App.tsx`.
- `v1.2.20`: Fixed API Base URL editing so clearing a preset URL does not immediately restore the default while pasting a replacement.
- `v1.2.21`: Extracted editable API profile draft helpers for Base URL draft validation and sanitization.
- `v1.2.22`: Added provider capability types and default capability inference without changing requests.
- `v1.2.23`: Added final 1.2-series release audit checks for version records, README shape, forbidden upload files, and publishing readiness.
- `v1.2.24`: Aligned formula-block horizontal scrolling with the table scroll strategy so formulas no longer eagerly capture vertical message-list drags.
- `v1.2.25`: Reverted the v1.2.24 formula scroll experiment and restored the v1.2.23 eager formula horizontal-scroll behavior.
- `v1.2.26`: Replaced the eager formula gesture wrapper with a formula-only directional drag layer so horizontal formula panning does not deliberately capture vertical message-list drags.
- `v1.2.27`: Reverted the v1.2.26 directional formula drag experiment after device testing showed vertical drags were still captured; keep the v1.2.25 formula horizontal-scroll behavior until a lower-risk gesture prototype is available.
- `v1.3.0`: Publish the latest v1.2.27 stable behavior as the next public minor release, without runtime behavior changes.
- `v1.3.1`: Move the left-edge drawer opener off the transparent overlay and require a clear horizontal swipe so vertical message scrolling still works in the left quarter, especially in landscape.
- `v1.3.2`: Restore drawer open/close settling animations while keeping fallback snaps so interrupted gestures cannot leave the drawer half-open.
- `v1.3.3`: Add a bounded push-style main scene translation during drawer open/close so the chat surface moves with the drawer without restoring the old half-open behavior.
- `v1.3.4`: Replace the bounded drawer push with a shared-canvas motion model where the menu sits left of the chat surface and both translate together while opening and closing.
- `v1.3.5`: Tried a single translated horizontal canvas for smoother drawer motion; rejected after device testing.
- `v1.3.6`: Tried RNGH/Reanimated drawer dragging; rejected after device testing because the feel was worse.
- `v1.3.7`: Revert drawer behavior back to the v1.3.4 shared-canvas implementation while preserving forward version/install compatibility.
- `v1.3.8`: Fix closed-state drawer false positives by capping the left-edge opener and double-checking the recorded touch-start X.
- `v1.3.9`: Tune the left drawer opener toward the older quick swipe feel while keeping the capped edge-start guard, and clarify About-page contribution boundaries.
- `v1.3.10`: Add an isolated Drawer Lab for testing built-in RNGH DrawerLayout behavior before replacing the production chat drawer.
- `v1.3.x`: Add network search profile settings behind provider capability checks.
