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

Current version: `v1.4.0`.

## Current Phase

The project is still in a stabilization/polish phase rather than a feature-expansion phase, and `v1.4.0` intentionally starts from the final `v1.3.108` stabilization checkpoint instead of bundling a large behavioral change into the version boundary itself.

- Do not add new end-user features by default.
- Prioritize bug fixing, smoother interactions, lower layout churn, and better startup/runtime stability.
- Prefer removing regressions and reducing jank over introducing new settings, labs, or UI surface area.
- If a change improves one interaction but risks another stable path, keep the current stable behavior and narrow the patch further.

## Refactor Rules

- Change one low-coupling direction per patch version.
- Do not mix gesture, Markdown, composer, and bottom-sheet rewrites in one version.
- Prefer extracting existing behavior before changing behavior.
- Add focused English comments near non-obvious boundaries, especially privacy, platform quirks, gesture arbitration, and export/import compatibility.
- Keep behavior-preserving extractions guarded by `tsc`, `smoke`, and targeted manual testing.
- If a new abstraction makes a stable interaction worse, stop and keep the previous stable version.
- Low-risk workflow papercuts may be fixed along the way when they reduce repeated development friction or token waste, but keep them separate from risky runtime behavior changes whenever possible.
- Terminal and tooling defaults that improve repeatability, such as stable UTF-8 shell output, should be preserved once fixed instead of being reworked ad hoc in later sessions.
- During the current stabilization phase, only take on refactors when they directly reduce real bugs, visible jank, or repeated maintenance risk in already-shipped flows.

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

Short-term note:
- The historical queue below remains useful as context, but the active near-term plan is optimization-only: bug fixing, interaction polish, and performance/stability work before any new feature work resumes.

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
- `v1.3.11`: Make the Drawer Lab easier to compare by adding visible edge-zone markers, drawer progress telemetry, and clearer front/back/slide motion labels.
- `v1.3.12`: Add a Drawer Lab engine switch between legacy DrawerLayout and ReanimatedDrawerLayout, while keeping the experiment isolated from the production drawer.
- `v1.3.13`: Fix the Drawer Lab modal gesture root, render its formula sample through the real Markdown/KaTeX path, and restore a stronger Android keyboard-lift fallback for the main chat composer.
- `v1.3.14`: Pause further lab expansion, re-enable Android `KeyboardAvoidingView` height fallback for the main chat shell, and restore inline code-block horizontal scrolling to avoid broken wrapped code lines.
- `v1.3.15`: Revert the Android chat-shell height fallback that lifted the composer too aggressively, and widen inline code-width estimation for CJK-heavy code samples so long lines keep horizontal scrolling.
- `v1.3.18`: Add a supported-profile web-search toggle for OpenAI Responses API and wire the official `web_search` tool into matching Responses requests without changing Chat Completions behavior.
- `v1.3.19`: Extract the Settings > About section into a dedicated presentational component so `App.tsx` keeps shrinking without changing settings actions or other runtime behavior.
- `v1.3.20`: Add configurable built-in theme presets and keep custom chat backgrounds as a later isolated appearance step.
- `v1.3.21`: Keep the production drawer untouched while making Drawer Lab use explicit content-first gesture locking so table-horizontal-scroll experiments are more representative.
- `v1.3.22`: Keep Drawer Lab tables on the same non-eager scroll path as production chat and only lock the lab drawer from the table touch boundary.
- `v1.3.23`: Extract the Settings > Appearance controls into a presentational component so `App.tsx` keeps shrinking and future custom backgrounds can land on the same appearance layer without touching settings state flow.
- `v1.3.24`: Strengthen graphite and sunset theme tokens across the full surface/input/border stack so built-in appearance presets read as whole-app themes instead of minor accent swaps.
- `v1.3.25`: Carry theme presets into the main interaction chrome, including top action buttons, back buttons, model pills, and the composer/button surfaces.
- `v1.3.26`: Finish the remaining API-settings primary action theming and move assistant reply bubbles onto preset-aware surfaces so the conversation area reflects each theme as clearly as the surrounding chrome.
- `v1.3.27`: Lock public publishing into release-only mode so README, checklist, and release audit all assume future GitHub updates are APK/release-note drops rather than routine source syncs.
- `v1.3.28`: Add a dedicated Settings > Interaction and Gestures surface plus persisted drawer trigger preferences before wiring those preferences into the production chat drawer.
- `v1.3.29`: Add an inline trigger-zone preview to the interaction settings page so edge-width tuning becomes visible before the production chat drawer starts consuming these preferences.
- `v1.3.30`: Add reusable settings-form keyboard avoidance so lower text inputs scroll above the Android keyboard across API and interaction settings before any larger settings-screen extraction.
- `v1.3.31`: Wire the saved interaction drawer trigger preference into the production chat drawer so fullscreen mode and edge-width tuning affect the real chat opener without changing drawer motion.
- `v1.3.32`: Add a first built-in chat background layer and keep it on the appearance path so future custom background images can land without mixing into gesture or Markdown work.
- `v1.3.33`: Tighten the first chat background pass so preset switching is visibly distinct in the live chat surface before moving on to custom background images.
- `v1.3.34`: Move the decorative chat background behind the whole chat shell so the top chrome gap and composer area no longer fall back to a plain solid surface.
- `v1.3.35`: Add Appearance controls for choosing and clearing a custom local chat background image, store that image outside the attachment cache boundary, and lift the background layer high enough that both custom images and built-in presets span the full live chat shell.
- `v1.3.36`: Keep the appearance work isolated by adding background-image opacity presets, system crop-on-pick, and tap-to-expand chooser cards for theme preset, chat background, and light/dark mode without touching gestures or Markdown rendering.
- `v1.3.37`: Keep the appearance work isolated by replacing fixed opacity presets with direct 0-100 input and a tighter background-image settings card, without changing gestures, Markdown rendering, or request flow.
- `v1.3.38`: Harden startup against oversized local chat history by deferring non-critical bootstrap steps, windowing long-conversation first render, and adding a recovery path instead of trapping the user on the loading screen.
- `v1.3.39`: Fix startup recovery for AsyncStorage CursorWindow failures by deleting the persisted state key directly, without first reading the oversized row that caused startup to hang.
- `v1.3.40`: Separate chat-state persistence from saved API profile/config persistence so startup recovery can clear broken local chats without deleting API settings.
- `v1.3.41`: Add storage actions for exporting all chats, opening chat/cache locations, clearing only local chat records after a mandatory export, and backing up raw local chat storage before startup recovery clears an oversized store.
- `v1.3.42`: Add per-conversation local-size protection so warning and hard-stop thresholds are enforced before oversized chats can corrupt startup again.
- `v1.3.43`: Simplify Chat Storage recovery boundaries by separating chat clearing from attachment-cache clearing, preserving API config during routine cleanup, removing routine full-export from the normal settings flow, and keeping raw export only in the startup-recovery path.
- `v1.3.44`: Split local chat persistence into an encrypted conversation index plus per-conversation encrypted records, while keeping in-memory chat behavior stable and migrating the old bundled state automatically.
- `v1.3.45`: Upgrade session export from clipboard copy to user-saved files, skip unreadable conversation rows during startup, and use safer private-file opening for local attachments.
- `v1.3.46`: Add a targeted unreadable-session recovery card so skipped broken local rows can be exported individually when readable, otherwise backed up as raw AsyncStorage files before deleting only that broken session.
- `v1.3.47`: Replace deprecated React Native SafeAreaView usage with `react-native-safe-area-context` and extend the theme preset layer with additional built-in palettes without touching the production gesture path.
- `v1.3.48`: Keep the product surface stable while cleaning app-owned Android build/runtime papercuts: use Android 13+ typed shared-intent parcelable readers with compatibility fallback and move our Gradle Groovy property assignments to the modern syntax.
- `v1.3.49`: Audit the production drawer against Drawer Lab and keep the same gesture thresholds while pre-mounting the drawer tree offscreen after startup so opening the real drawer does not pay the first-mount cost mid-swipe.
- `v1.3.50`: Keep the production drawer structure unchanged but remove the first-frame jump when the open gesture is claimed by aligning the drawer immediately to the finger's current drag distance.
- `v1.3.51`: Keep the production drawer engine unchanged but give only the very left edge a narrower early-claim path so clearly intentional edge-started right swipes can open the real drawer sooner without relaxing the wider chat area.
- `v1.3.52`: Keep the production drawer engine and open/close decisions unchanged but apply live drawer drag updates immediately during the gesture so slow drags stay closer to the finger instead of waiting for an extra animation frame.
- `v1.3.53`: Keep the production drawer gesture model unchanged but shorten the drawer settle-duration window so open/close completion feels snappier after the drag is released.
- `v1.3.54`: Replace the production shared-canvas drawer shell with the same Legacy DrawerLayout base used in Drawer Lab, so the real left drawer follows the lab-style non-fullscreen structure before any further gesture smoothing.
- `v1.3.55`: Keep the production drawer base unchanged but remove the production-only programmatic speed overrides so non-gesture drawer opens and closes stay closer to the lab's default DrawerLayout motion.
- `v1.3.59`: Keep runtime behavior stable while extracting session-export and attachment-cache-stat helpers out of `App.tsx`, creating cleaner library boundaries before the next round of low-risk hook/component splits.
- `v1.3.60`: Keep runtime behavior stable while extracting settings-storage helpers for unreadable-session export/delete and storage-location fallback handling, so the storage/recovery area can keep shrinking without touching gestures or Markdown rendering.
- `v1.3.61`: Keep runtime behavior stable while extracting the repeated post-clear recovery helper for chat cleanup and startup recovery, so profile/config restoration stays on one storage path before any larger App-shell splits.
- `v1.3.62`: Extract Settings > Storage into a dedicated presentational component so `App.tsx` keeps shrinking without changing storage actions, unreadable-session recovery, or cleanup behavior.
- `v1.3.63`: Reuse the existing in-app attachment preview modal for message image attachments so sent and received images can be tapped for a larger preview without changing non-image attachment handoff behavior.
- `v1.3.64`: Replace the old card-style chat image preview with a true full-screen image viewer and tighten image-only bubble rendering, while keeping the change isolated from drawer gestures, Markdown/table/formula scroll, and composer behavior.
- `v1.3.65`: Keep the real message storage shape stable while refining the presentation layer around attachments and streaming: mixed image+text user turns render as split image/text bubbles, the full-screen image modal regains in-modal pinch zoom, the pending attachment strip moves to thumbnail-first tiles, and streaming output no longer forces the chat view to the bottom unless the user opts back in through a jump-to-latest affordance.
- `v1.3.66`: Narrow the production image viewer back to a stable full-screen preview with tap-to-close only, move image-zoom experimentation back behind the Drawer Lab boundary, and keep the visible close affordance aligned with the safe area using a plain `X` instead of an extra button chrome.
- `v1.3.67`: Keep the production viewer unchanged and add a dedicated Drawer Lab image-gesture experiment instead, so pinch zoom and post-zoom dragging can be tuned in isolation with reset controls and smoke coverage before another production attempt.
- `v1.3.68`: Keep the production viewer unchanged and narrow the Drawer Lab image experiment's gesture arbitration so idle touches over the sample image still allow vertical scrolling and drawer-edge swipes, while pinch and zoomed-pan keep their isolated boundary locks.
- `v1.3.69`: Keep the production viewer unchanged and move Drawer Lab image zoom entirely behind a dedicated full-screen modal, so the inline settings-page sample is tap-only and the zoom experiment no longer competes with page scroll or drawer gestures.
- `v1.3.70`: Keep the production viewer unchanged and replace the Drawer Lab fullscreen pinch implementation with the maintained `@likashefqet/react-native-image-zoom` component plus Android modal-safe gesture wrapping, reducing custom gesture code before any future production retry.
- `v1.3.71`: Keep the production viewer unchanged and remove the Drawer Lab nested modal entirely, rendering the zoom experiment as a single absolute overlay inside the existing lab modal so Android only has one modal layer to arbitrate during pinch tests.
- `v1.3.72`: Keep the production viewer unchanged and strengthen only the Drawer Lab fullscreen zoom diagnosis path with forced-active gesture roots, host interaction lockout, and visible callback/programmatic-zoom counters so Android tests can tell whether pinch input is reaching the zoom surface at all.
- `v1.3.73`: Keep the production viewer unchanged and detach the Drawer Lab fullscreen zoom test from the drawer/scroll host entirely while it is open, leaving only the fullscreen gesture panel so the next device run can confirm whether the host shell was intercepting pinch.
- `v1.3.74`: Reconnect the verified zoom path back into the production chat image viewer with minimal chrome, while keeping keyboard/composer jank as a separate follow-up version instead of mixing another layout-risk change into the same patch.
- `v1.3.75`: Keep the verified production image viewer unchanged and narrow the next Android stability pass to keyboard-open behavior only, debouncing repeated re-pin scrolls and letting the native inset bridge lead over the JS fallback during IME transitions.
- `v1.3.76`: Keep the verified production image viewer unchanged and continue narrowing Android keyboard-open churn by suppressing pre-inset composer auto-lift and removing Android's extra chat-padding echo of that lift state.
- `v1.3.77`: Keep the verified production image viewer unchanged and remove the now-unused Android composer auto-lift measurement work, so keyboard-open transitions no longer repeatedly measure the composer tree during chat focus.
- `v1.4.0`: Open the next minor line from the stable `v1.3.108` baseline, keeping runtime behavior intentionally steady while switching the release boundary and private-release documentation over to the next cycle.
- `v1.3.108`: Use this as the intended `1.3` wrap-up baseline before `v1.4`, keeping runtime behavior stable while enriching only the Classic Blue theme palette in light and dark mode.
- `v1.3.107`: Keep runtime settings behavior unchanged and narrow this patch to another low-risk `App.tsx` split by extracting the settings page header into `SettingsHeader`, while leaving section selection and navigation behavior in `App.tsx`.
- `v1.3.106`: Keep runtime settings behavior unchanged and narrow this patch to another low-risk `App.tsx` split by extracting the settings home navigation card list into `SettingsRootSection`, while leaving summary text calculation and actual section navigation in `App.tsx`.
- `v1.3.105`: Keep runtime language behavior unchanged and narrow this patch to another low-risk `App.tsx` split by extracting the language settings radio list into `SettingsLanguageSection`, while leaving persisted language state and settings navigation in `App.tsx`.
- `v1.3.104`: Keep runtime API behavior unchanged and narrow this patch to a low-risk `App.tsx` split by extracting the full API settings surface into `SettingsApiSection`, while leaving autosave, provider capability checks, testing, deletion, and keyboard focus handoff in `App.tsx`.
- `v1.3.103`: Keep networking, drawer, image preview, and Markdown behavior unchanged and narrow this patch to Android chat-input stability by suspending keyboard-follow compensation while the expanded composer owns input, resetting the follow baseline when composer mode changes, and skipping no-op follow scrolls when the chat has no meaningful scroll range.
- `v1.3.102`: Keep network search, keyboard, and drawer behavior unchanged and narrow this patch to streaming stability by making bottom-pinned follow use direct non-animated repositioning and only requeue after real content-height growth, reducing visible jitter during long streaming replies.
- `v1.3.101`: Keep the request/search layer unchanged and continue the same UX path by showing an inline composer hint for clearly current-sensitive prompts, so users can see before sending whether this turn will search the web, has search support disabled, or is on an unsupported profile.
- `v1.3.100`: Keep the request/search layer unchanged and narrow this patch to send-time UX only: when the active profile cannot search the web, clearly current-sensitive prompts now trigger a cooldown-limited reminder suggesting a supported OpenAI Responses profile, without blocking the send itself.
- `v1.3.99`: Keep the existing UI and settings flow unchanged while tightening the Responses live-search request layer: inject current local date/time grounding for current questions, explicitly tell supported Responses profiles to prefer web search for time-sensitive prompts, and fall back to final streamed payload text so tool-backed answers stay visible.
- `v1.3.98`: Keep the same API-settings-only scope while making autosave wait for a short edit-idle window and making the settings close path save only valid drafts, so invalid half-cleared API form edits are discarded instead of resurfacing as partial saved values later.
- `v1.3.97`: Keep the current chat keyboard path unchanged and narrow this patch to API settings text editing by pausing API profile autosave while any profile input stays focused, then letting the background save resume only after blur settles.
- `v1.3.96`: Narrow back to API settings editor behavior only by keeping draft-profile autosave in the background but stopping it from writing sanitized saved data back into the active editor mid-typing, so profile label and base URL edits no longer compete with delayed autosave completions.
- `v1.3.95`: Keep the current chat keyboard path unchanged and add a settings-modal-only Android `KeyboardAvoidingView` wrapper around the full settings surface, so the settings page can retreat from the IME without feeding any new keyboard avoidance behavior back into the main conversation screen.
- `v1.3.94`: Keep the current chat keyboard path unchanged and continue the settings-page Android keyboard regression follow-up by measuring focused settings inputs relative to the ScrollView content itself, then retrying after both keyboard-show and later IME frames, so Appearance opacity fields have more than one chance to settle above the keyboard without touching chat-surface behavior.
- `v1.3.93`: Keep the current chat keyboard path unchanged and narrow this patch to the settings-page Android keyboard regression by measuring focused settings inputs against the real scroll viewport and retrying after content-height changes, so lower Appearance fields stay above the IME without reopening chat-surface keyboard churn.
- `v1.3.92`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while replacing the chat shell's direct `useWindowDimensions()` path with a stabilized window-size listener that ignores Android keyboard-only height churn, so IME resize frames are less likely to re-render the whole app surface.
- `v1.3.91`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while moving Android chat keyboard inset consumption onto animated values plus refs, so IME transitions can keep lifting the chat controls without re-rendering the whole chat surface on every keyboard frame.
- `v1.3.90`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while clamping Android keyboard-follow scroll compensation to the real scroll range, so bottom-pinned chats are less likely to overshoot and flash during repeated IME transitions.
- `v1.3.89`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while restoring Android chat-surface keyboard inset consumption after the v1.3.88 split regressed into full composer overlap, so the app returns to a working bottom-avoidance baseline before any deeper keyboard-jank investigation continues.
- `v1.3.88`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while removing Android chat-surface dependence on mirrored JS keyboard inset state, so the main conversation can ride native `adjustResize` motion while settings still retain explicit keyboard padding.
- `v1.3.87`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while letting the Android native inset bridge own close-time composer reset, so `onBlur` and `keyboardDidHide` stop yanking the composer to zero mid-animation.
- `v1.3.86`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while swapping the delayed Android keyboard settle snap for direct bottom-cover delta compensation, so the conversation follows the composer during IME open/close instead of flashing after a late re-pin.
- `v1.3.85`: Keep keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while stabilizing the callback props passed into memoized chat bubbles and the pending attachment rail, so Android keyboard inset updates avoid re-rendering the whole conversation content on each frame.
- `v1.3.84`: Keep chat, drawer, image gestures, and Markdown behavior unchanged while smoothing Android keyboard-open/close motion with frame-coalesced inset commits, and simplify Appearance by removing the old grid/band background preset path so plain color becomes the automatic fallback whenever no custom background image is set.
- `v1.3.83`: Keep chat, drawer, image gestures, and Markdown behavior unchanged while tightening the startup presentation again: shrink the real app icon/splash mark inside its canvas, drop the normal in-app loading artwork entirely, and keep only the minimal startup-recovery affordance for exceptional long local restores.
- `v1.3.82`: Keep chat, drawer, image gestures, and Markdown behavior unchanged while correcting the startup-branding pass: regenerate the real app icon set from the provided mark, return the native launch surface to a centered lightweight icon, and keep the in-app offline bootstrap on a small-logo + GIF loader path instead of a full cover image.
- `v1.3.81`: Keep chat, drawer, and Markdown behavior unchanged while polishing startup UX with the provided cover mark, an offline bootstrap loading animation, and clearer waiting/recovery messaging during slow local chat imports.
- `v1.3.80`: Keep keyboard, image viewer, drawer gestures, and Markdown behavior unchanged while trimming the extra Android top padding applied above the chat header and session drawer header, so the top controls sit closer to the top shell without crowding the status bar.
- `v1.3.79`: Keep the verified production image viewer unchanged and coalesce Android keyboard inset state commits, so IME animation frames stop forcing a full React layout pass on every intermediate bottom value while the final inset still settles exactly.
- `v1.3.78`: Keep the verified production image viewer unchanged and remove the remaining Android no-op composer auto-lift call sites, so focus, layout, and keyboard hooks stop re-entering that dead path during keyboard open.
- `v1.3.x`: Add network search profile settings behind provider capability checks.
