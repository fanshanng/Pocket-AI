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
- Current version: `1.4.0` / Android `versionCode 172`.
- Current v1.4.0 APK SHA-256: `1FA49F78A372C5035063270EA841A1F46C72259312B7FCEA9BD82DFC6AE3597A`.
- Current release APK path: `E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk`.
- Local terminal defaults are now configured to read UTF-8 cleanly; repeated shell-output encoding workarounds should not be reintroduced unless a command still proves otherwise.
- Public GitHub publishing mode is now release-only. Do not assume future source pushes; public updates should default to GitHub Release notes and APK assets unless the user explicitly asks to sync a new source snapshot.
- Current development phase: `v1.4.0` opens from the stable `v1.3.108` baseline. The immediate expectation is still cautious iteration: do not spend the version jump on mixed high-risk rewrites unless a dedicated plan is agreed first.

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
- v1.2.17 refreshes the public README and adds `docs/ARCHITECTURE_PLAN.md` as the living architecture/roadmap document; runtime behavior is unchanged.
- v1.2.18 extracts the pending attachment chip rail into `src/components/PendingAttachmentBar.tsx` as the first low-risk presentational split from `App.tsx`; attachment behavior is unchanged.
- v1.2.19 extracts the model picker header, API profile chips, and model list into `src/components/ModelPickerContent.tsx` while leaving bottom-sheet animation and model/profile state in `App.tsx`; picker behavior is unchanged.
- v1.2.20 fixes API Base URL editing so clearing a preset URL no longer immediately restores the default while the user is replacing it; saved profiles and network actions still require a non-empty URL.
- v1.2.21 extracts editable API profile draft helpers into `src/lib/profileDrafts.ts` so Base URL draft behavior is guarded outside `App.tsx`; UI and request behavior are unchanged.
- v1.2.22 adds provider capability metadata and default inference in `src/lib/providerCapabilities.ts` as a foundation for future per-profile features such as web search; request behavior and UI are unchanged.
- v1.2.23 adds a release audit script and final 1.2-series publishing checks for version consistency, release notes completeness, README cleanliness, and forbidden upload files; runtime behavior is unchanged.
- v1.2.24 changes block formulas to use the same horizontal-scroll gesture strategy as tables, so vertical drags over formulas can continue scrolling the message list.
- v1.2.25 reverts the v1.2.24 formula scroll experiment and restores the v1.2.23 eager formula horizontal-scroll implementation because v1.2.24 broke formula horizontal scrolling.
- v1.2.26 changes block formulas to a formula-only directional drag layer so clear horizontal drags pan long formulas while vertical drags can remain with the message list.
- v1.2.27 reverts the v1.2.26 formula directional-drag experiment after device testing showed vertical drags over formulas were still captured; formula horizontal scrolling is restored to the v1.2.25 behavior.
- v1.3.0 publishes the latest v1.2.27 stable behavior as the next minor release without runtime behavior changes.
- v1.3.1 fixes the left-edge drawer opener so the visual left-quarter edge no longer intercepts vertical message scrolling; the drawer now opens only after a clear horizontal right swipe that starts in the left edge.
- v1.3.2 restores left drawer open/close settling animations while keeping fallback snaps to fully open/closed states so interrupted gestures do not leave the drawer half-open.
- v1.3.3 adds a bounded push-style main scene translation during drawer open/close so the chat surface moves with the drawer while retaining the v1.3.1 strict edge-swipe gate and v1.3.2 fallback snaps.
- v1.3.4 changes the left drawer to a shared-canvas motion model: the drawer sits to the left of the chat surface, and both move together during open and close while keeping the existing gesture thresholds and fallback snaps.
- v1.3.5 and v1.3.6 tried smoother drawer implementations but were rejected after device testing because the drag feel was worse.
- v1.3.7 reverts the drawer implementation back to the v1.3.4 shared-canvas behavior while keeping the app version moving forward for install/update compatibility.
- v1.3.8 fixes the closed-state drawer opener so right swipes from the middle or right side of the screen no longer open the drawer; the opener now uses a capped left-edge width and a recorded touch-start X check.
- v1.3.9 restores a quicker older-style left drawer open threshold while preserving the v1.3.8 capped edge-start guard, and clarifies the About page contribution boundaries.
- v1.3.10 adds an isolated Drawer Lab under Settings > About to test the built-in RNGH DrawerLayout feel without replacing the production chat drawer.
- v1.3.11 expands the Drawer Lab with visible edge-zone markers, progress telemetry, and distinct front/back/slide motion labels so the swipe experiments are easier to tell apart.
- v1.3.12 adds a Drawer Lab engine switch between legacy DrawerLayout and ReanimatedDrawerLayout, and records the minimal Reanimated Babel/dependency setup needed to keep that experiment reproducible.
- v1.3.13 fixes the Drawer Lab modal so RNGH drawer gestures can run inside the lab again, renders the formula example through the real Markdown/KaTeX pipeline, and adds a stronger Android keyboard-lift fallback for the main chat composer.
- v1.3.14 narrows back to stabilization work: Android `KeyboardAvoidingView` height behavior is re-enabled for the main chat shell, and inline code blocks scroll horizontally again instead of forcing long wrapped lines.
- v1.3.15 reverts the Android chat-shell height behavior to the earlier iOS-only path and improves code-block width estimation for wide CJK/comment lines so inline code stays horizontally scrollable instead of wrapping too early.
- v1.3.18 adds a per-profile web-search toggle for supported OpenAI Responses API configurations and sends the official `web_search` tool only for those supported profiles, leaving Chat Completions and custom-compatible gateways unchanged.
- v1.3.19 extracts the Settings > About content into `src/components/SettingsAboutSection.tsx` as a behavior-preserving presentational split so future settings work can keep shrinking `App.tsx` without touching drawer, Markdown, or composer logic.
- v1.3.20 introduces configurable built-in theme presets on top of the existing light/dark/system mode, so appearance colors now live in reusable palette presets before future custom chat backgrounds are added.
- v1.3.21 keeps the production chat drawer unchanged and tightens Drawer Lab gesture arbitration so wide Markdown tables can claim horizontal drags in both directions without the lab drawer immediately opening.
- v1.3.22 keeps the production drawer unchanged and narrows Drawer Lab table handling back toward the production chat behavior so vertical list scrolling can pass through while table touches still lock the lab drawer opener.
- v1.3.23 extracts the Settings > Appearance section into `src/components/SettingsAppearanceSection.tsx` as a behavior-preserving presentational split, keeping theme preset and mode actions unchanged while preparing a cleaner home for future custom backgrounds.
- v1.3.24 broadens the built-in theme presets so graphite and sunset change the full light/dark surface stack more visibly instead of only shifting small accent areas.
- v1.3.25 extends the preset colors into the interaction chrome so top circular buttons, back buttons, model pills, composer surfaces, and send controls now follow each theme instead of staying mostly white.
- v1.3.26 finishes the remaining API-settings primary button theming and gives assistant reply bubbles their own preset-aware surfaces so each built-in theme carries through the conversation area as well.
- v1.3.27 switches the public publishing workflow to release-only mode: the README becomes user-facing, the checklist documents closed-source release steps, and the release audit now guards against accidentally treating the public repo as an actively synced source mirror.
- v1.3.28 adds a dedicated Settings > Interaction and Gestures section with persisted drawer trigger preferences and moves Drawer Lab into that section, while leaving the production chat drawer behavior unchanged for now.
- v1.3.29 adds an inline drawer trigger zone preview to Settings > Interaction and Gestures so edge-width px changes immediately show the active recognition area without changing the production drawer logic yet.
- v1.3.30 adds generic settings-form keyboard avoidance so lower API and interaction inputs scroll above the Android keyboard instead of staying hidden behind it.
- v1.3.31 wires the saved Interaction and Gestures drawer trigger preference into the production chat drawer, so fullscreen vs edge mode and the edge px width now affect the real chat screen opener.
- v1.3.32 adds a first built-in chat background layer so Appearance can now switch the live chat screen between plain, grid, and horizontal-band backgrounds without touching message rendering or attachment flows.
- v1.3.33 strengthens the chat background presets so grid and band modes stay clearly visible during normal conversation use instead of reading like the same plain surface.
- v1.3.34 moves the decorative chat background layer behind the full chat shell so the preset now also covers the top gap and the composer area instead of stopping at the scroll body.
- v1.3.35 adds custom chat background image picking/clearing in Appearance, stores the chosen image in a dedicated local background directory, and lifts the full-scene background layer one level higher so custom images and built-in backgrounds both span the full live chat shell.
- v1.3.36 adds system-cropped custom background selection, saved background-image opacity presets, and a cleaner tap-to-expand Appearance layout so theme preset, chat background, and light/dark mode selections each live in their own focused chooser card.
- v1.3.37 keeps the appearance work isolated by replacing the fixed background-image opacity presets with direct 0-100 input, tightening the background-image card UI, and clarifying the display-mode card label without touching gestures, Markdown rendering, or chat flow.
- v1.3.38 adds startup resilience for oversized local chat stores by deferring non-critical bootstrap work, limiting first-render cost for long conversations, and exposing a loading-screen recovery action instead of leaving the app stuck on startup.
- v1.3.39 fixes the recovery path itself: oversized AsyncStorage rows can fail even during `getItem`, so startup recovery now removes the persisted state key directly without trying to read or quarantine that broken row first.
- v1.3.40 separates saved API profile/config persistence from chat-state persistence so startup recovery can clear broken local chats without wiping API settings.
- v1.3.41 turns Settings > Chat Storage into an actionable recovery surface: users can export all chats, jump toward chat/cache locations, clear only local chat records after a mandatory export, and let startup recovery save a raw local chat-store backup before clearing an oversized broken store.
- v1.3.42 adds per-conversation length protection with warning and hard-stop thresholds, session badges, in-chat warnings, and send blocking before oversized chats can poison local startup again.
- v1.3.43 refines Settings > Chat Storage so clearing chat records no longer clears API config or attachment cache, adds a separate attachment-cache clear action, removes routine in-app full-chat export from the normal settings flow, and keeps raw export only for startup recovery when the app is already stuck loading.
- v1.3.44 replaces the old single bundled local chat row with an encrypted conversation index plus one encrypted AsyncStorage record per conversation, and migrates older bundled chat state automatically when loaded.
- v1.3.45 upgrades session export from clipboard-only Markdown/JSON copy to real user-saved files, skips unreadable local sessions during startup instead of blocking the whole app, and uses safer private-file opening for local attachments.
- v1.3.46 adds a Settings > Chat Storage recovery card for unreadable sessions so each skipped broken local record can be exported individually when possible, or fall back to a raw AsyncStorage backup before deleting only that broken session.
- v1.3.47 migrates the app off React Native's deprecated built-in SafeAreaView to `react-native-safe-area-context` and expands the appearance system with two additional built-in theme presets: forest and rose.
- v1.3.48 modernizes the Android shared-image intent reader for Android 13+ typed parcelable APIs and replaces our app-owned deprecated Gradle Groovy space-assignment syntax with assignment form, without changing chat, storage, or drawer behavior.
- v1.3.49 keeps the production drawer gesture model intact but pre-mounts the drawer tree after startup idle so the first real drawer swipe does not have to mount the whole drawer surface mid-gesture.
- v1.3.50 keeps the production drawer structure unchanged but removes the first-frame jump when the open gesture is claimed by aligning the drawer immediately to the finger's current drag distance.
- v1.3.51 keeps the production drawer engine unchanged but gives only the very left edge a narrower early-claim path, so clearly intentional edge-started right swipes can open the real drawer sooner without relaxing the wider chat area.
- v1.3.52 keeps the production drawer engine and open/close decisions unchanged but applies live drawer drag updates immediately during the gesture so slow drags stay closer to the finger instead of waiting for an extra animation frame.
- v1.3.53 keeps the production drawer gesture model unchanged but shortens the drawer settle-duration window so open/close completion feels snappier after the drag is released.
- v1.3.54 replaces the production shared-canvas drawer shell with the same Legacy DrawerLayout base used in Drawer Lab, so the real left drawer no longer relies on the fullscreen custom overlay path.
- v1.3.55 keeps the production drawer structure unchanged but removes the production-only programmatic drawer speed overrides, so menu-button opens, closes, and settings returns can follow the same default Legacy DrawerLayout motion profile used in Drawer Lab.
- v1.3.56 keeps the stable drawer base unchanged and focuses on day-to-day chat stability: the app now opens into a draft-style empty chat without creating a blank saved session, opening an existing session more aggressively re-pins to the latest messages, Android composer lift is wired back into layout padding, and Appearance adds a persisted chat-bubble opacity control with a cleaner card layout.
- v1.3.57 fixes several follow-up regressions from the draft/appearance pass: cold starts now stay on the draft surface instead of reopening the most recent chat, chat-bubble opacity now affects the real message bubbles instead of preview-only UI, background-image opacity is aligned with user expectations so higher values reveal more of the image, and Appearance opacity inputs are wired into the settings keyboard auto-scroll path on Android.
- v1.3.58 keeps the existing background-image rendering logic unchanged but renames the setting to background-image visibility/opacity wording that better matches how it feels in the current UI, and chat-bubble opacity now supports the full `0-100` range so the bubble surface can become fully transparent while leaving message text visible.
- v1.3.59 keeps behavior unchanged but extracts session-export and attachment-cache-stat helper logic out of `App.tsx` into focused library modules, so the next low-risk App.tsx splits can build on cleaner boundaries without touching gestures, Markdown rendering, or persistence behavior.
- v1.3.63 keeps runtime behavior stable while letting message image attachments reuse the existing in-app preview modal, so sent and received images can be tapped for a larger preview without changing file-open behavior for non-image attachments.
- v1.3.64 replaces that card-style preview with a true full-screen image viewer that supports tap-to-close, pinch zoom, and drag-after-zoom, and it also makes image-only chat turns render as ratio-preserving media cards instead of padded text bubbles.
- v1.3.65 keeps the same attachment/message data model but splits mixed image+text user turns into separate visual image and text bubbles, restores pinch-zoom support inside the full-screen image viewer modal, simplifies the pending attachment strip into thumbnail-first tiles, and stops streaming replies from auto-snapping the reader back to the bottom unless the user explicitly taps the new jump-to-latest button.
- v1.3.66 intentionally removes the unstable full-screen image pinch path from the production chat viewer, keeps image preview on a simpler tap-to-close full-screen path with a cleaner safe-area-aware close `X`, and makes image-zoom gestures lab-first work that should be validated in Drawer Lab before returning to the main chat flow.
- v1.3.67 follows through on that lab-first plan by adding an isolated Drawer Lab image-gesture surface with sample-image pinch zoom, post-zoom dragging, reset controls, and smoke guards, while leaving the production chat image viewer on the stable non-gesture path from v1.3.66.
- v1.3.68 keeps the production chat image viewer unchanged and narrows the Drawer Lab image experiment so pinch locking only happens during active zoom gestures, while idle touches over the sample image keep vertical scrolling and left-drawer edge swipes available until the image is actually zoomed in.
- v1.3.69 keeps the production chat image viewer unchanged and simplifies the Drawer Lab image experiment further: the settings-page sample image is now tap-only, and pinch zoom plus post-zoom dragging only run inside a dedicated full-screen modal layer above the lab.
- v1.3.70 keeps the production chat image viewer unchanged but replaces the Drawer Lab hand-rolled fullscreen pinch implementation with the maintained `@likashefqet/react-native-image-zoom` component plus Android modal-safe wrapping, so the lab now follows the same mature solution pattern recommended by its upstream docs.
- v1.3.71 keeps the production chat image viewer unchanged and removes the Drawer Lab nested full-screen modal entirely: the inline sample still opens from the settings page, but the zoom test now renders as a single absolute fullscreen overlay inside the existing lab modal so Android only has to arbitrate one modal layer.
- v1.3.72 keeps the production chat image viewer unchanged and strengthens only the Drawer Lab fullscreen image experiment: the lab now forces a local RNGH active root, locks drawer/scroll interaction while the overlay is open, and exposes `2x` plus callback counters so device testing can tell whether Android is dropping pinch events or the zoom surface itself is failing.
- v1.3.73 keeps the production chat image viewer unchanged and strips the Drawer Lab fullscreen image experiment down even further: once the preview opens, the lab temporarily unmounts the drawer/scroll host and leaves only the fullscreen gesture panel, so device testing can confirm whether `DrawerLayout` is the layer that was eating native pinch input.
- v1.3.74 reconnects the now-verified pinch zoom path back into the production chat image viewer: fullscreen image previews again support real pinch zoom, drag after zoom, and double-tap zoom on device, while the viewer chrome stays minimal with only the top-right close `X`.
- v1.3.75 isolates the next Android chat-input stability pass: the production image viewer stays unchanged, while keyboard-open re-pin behavior is debounced and the JS keyboard fallback yields to the native insets bridge instead of driving the same layout path twice during IME transitions.
- v1.3.76 keeps the production image viewer unchanged and continues the Android keyboard stability pass: pre-inset composer auto-lift is now suppressed until the native bridge reports a real bottom inset, and Android chat padding no longer echoes the extra composer-lift state during keyboard open.
- v1.3.77 keeps the production image viewer unchanged and trims remaining Android keyboard-open overhead by fully disabling the now-unused Android composer auto-lift measurement path, so keyboard transitions no longer repeatedly `measureInWindow` a giant `App.tsx` tree during chat input focus.
- v1.4.0 opens the next minor line from the stable v1.3.108 baseline. This is a release-boundary version for the next closed-source/manual-release phase rather than a risky runtime feature jump.
- v1.3.108 is the intended `1.3` wrap-up baseline before opening the `1.4` cycle. It keeps behavior stable and only enriches the Classic Blue theme preset so the default visual identity feels more complete.
- v1.3.107 keeps runtime settings behavior unchanged and narrows this patch to another low-risk `App.tsx` split: the settings page top header now renders through a dedicated `SettingsHeader` component, while `App.tsx` keeps owning section selection and navigation behavior.
- v1.3.106 keeps runtime settings behavior unchanged and narrows this patch to another low-risk `App.tsx` split: the settings home navigation card list now renders through a dedicated `SettingsRootSection` component, while `App.tsx` keeps owning summary text calculation and actual section navigation actions.
- v1.3.105 keeps runtime language behavior unchanged and narrows this patch to another low-risk `App.tsx` split: the language settings radio list now renders through a dedicated `SettingsLanguageSection` component, while `App.tsx` keeps owning persisted language state and settings navigation.
- v1.3.104 keeps runtime API behavior unchanged and narrows this patch to a low-risk `App.tsx` split: the full API settings surface now renders through a dedicated `SettingsApiSection` component, while `App.tsx` keeps owning state, autosave, testing, deletion, keyboard focus handoff, and provider capability logic.
- v1.3.103 keeps networking, drawer, image preview, and Markdown behavior unchanged and narrows this patch to Android chat-input stability only: keyboard-follow compensation now stands down while the expanded composer is taking over input, resets its baseline when the composer mode changes, and skips no-op follow scrolls when the chat has no meaningful scroll range.
- v1.3.102 keeps the network-search and keyboard paths unchanged and narrows this patch to streaming-read stability only: bottom-pinned streaming follow now repositions quietly without replaying an animation on every delta, and follow attempts are only rescheduled after the chat content height actually changes instead of on every flush tick.
- v1.3.101 keeps the actual request/search behavior unchanged and follows up on the same network-search UX path with a more proactive hint surface: when the draft question looks current-sensitive, the composer now shows whether this turn will prefer web search, whether web search is supported but currently disabled, or whether the active profile does not support it at all.
- v1.3.100 keeps the actual search/request behavior unchanged and adds a small send-time UX reminder: if the user asks a clearly time-sensitive question like “今天几号” or “最近有什么事” while the active profile does not support web search, the app now shows a light reminder suggesting a supported OpenAI Responses profile, with a cooldown so it does not keep interrupting every send.
- v1.3.99 keeps the existing chat UI and API settings unchanged while tightening the live-search request path: Responses turns now inject the current local device date/time plus stronger search guidance for time-sensitive questions, and tool-backed streaming replies now fall back to the final payload text so联网回答不再更容易出现空答复或不稳定输出。
- v1.3.98 keeps the same API-settings-only scope and further tightens draft persistence: autosave now waits for a short edit-idle window before committing, and closing the API settings page now immediately saves only valid drafts while discarding invalid half-cleared edits instead of preserving partial intermediate values.
- v1.3.97 keeps the chat keyboard, drawer, image viewer, and Markdown paths unchanged while pausing API profile autosave whenever an API settings text input is focused, then resuming background save only after editing blur settles, so typing and deleting in the profile form no longer fight an in-flight autosave.
- v1.3.96 narrows back to API settings form behavior only: draft API profile autosave still persists in the background, but it no longer writes the sanitized saved profile back into the active editor while the user is typing, so profile label and base URL edits are less likely to snap back or delete newly typed characters.
- v1.3.95 keeps the current chat keyboard path unchanged and adds a settings-modal-only Android `KeyboardAvoidingView` wrapper around the full settings surface, so the settings page can shrink away from the IME without routing the main chat screen through any new keyboard logic.
- v1.3.94 keeps the current chat keyboard path unchanged and follows up only on the same settings-page Android keyboard regression: focused settings inputs now measure relative to the ScrollView content itself, retry again later in the IME animation, and recheck once the keyboard show event lands, so the Appearance opacity fields have a better chance to clear the keyboard without touching chat-surface behavior.
- v1.3.93 keeps the current chat keyboard path unchanged and narrows this patch to the settings-page Android keyboard regression: Appearance opacity inputs now measure against the real settings scroll viewport and recheck after content-height changes, so lower fields like chat-bubble opacity are less likely to stay covered by the IME.
- v1.3.92 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while replacing `useWindowDimensions()` with a stabilized window-size listener that ignores Android keyboard-only height churn on the chat surface, so IME open/close is less likely to re-render the whole `App.tsx` tree on every resize frame.
- v1.3.91 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while moving the Android chat-surface keyboard inset path off per-frame React state and onto animated values, so the composer and jump-to-latest affordance can still follow the IME without forcing the whole chat screen to re-render on each keyboard frame.
- v1.3.90 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while clamping Android keyboard-follow scroll compensation to the real scrollable range, so repeated IME open/close cycles are less likely to overshoot and flash when the list is already at its content edge.
- v1.3.89 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while restoring Android chat-surface keyboard inset consumption after the v1.3.88 split regressed into full composer overlap, so the chat input can rise above the IME again while settings keeps its keyboard padding path.
- v1.3.88 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while removing Android chat-surface dependence on mirrored JS keyboard inset state, so the conversation/composer path can stay on native `adjustResize` movement while settings forms still retain keyboard inset padding.
- v1.3.87 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while handing Android keyboard close-back control fully to the native inset bridge, so blur and `keyboardDidHide` no longer force the composer to `0` before the IME animation has actually finished.
- v1.3.86 keeps keyboard geometry, drawer gestures, image gestures, and Markdown behavior unchanged while replacing the delayed Android keyboard settle snap with direct bottom-cover delta compensation, so the chat list follows the composer during IME open/close instead of flashing after a late scroll-to-end correction.
- v1.3.85 keeps the existing keyboard geometry and chat behavior unchanged while stabilizing the callback props passed into memoized message bubbles and the pending attachment rail, so Android keyboard inset updates no longer fan out into avoidable full chat-content re-renders.
- v1.3.84 keeps chat, drawer, image gestures, and Markdown behavior unchanged while narrowing two UX papercuts: Android keyboard insets now commit once per frame instead of in coarse delayed steps, and Appearance removes the old grid/band chat-background presets so no-image mode simply falls back to the default solid background.
- v1.3.83 keeps chat, drawer, image gestures, and Markdown behavior unchanged while tightening startup visuals: the launcher and native splash mark now render with more breathing room, the normal in-app offline loading page no longer appears, and only the minimal long-start recovery surface remains if bootstrap really gets stuck.
- v1.3.82 keeps chat, drawer, image gestures, and Markdown behavior unchanged while correcting the startup branding pass: the provided mark is now the real app icon set, the native Android launch cover is back to a centered lightweight icon, and the in-app offline bootstrap screen uses a small logo plus GIF loader instead of a full cover image.
- v1.3.81 keeps chat, drawer, and Markdown behavior unchanged while upgrading startup UX: the provided cover mark is now used for both the native Android launch cover and the in-app offline bootstrap screen, with a local-only loading animation and clearer startup recovery messaging when large local chat imports take time.
- v1.3.80 keeps keyboard, image viewer, drawer gestures, and Markdown behavior unchanged while trimming the extra Android top padding in the chat header and session drawer header, so the top buttons sit visually closer to the rounded app shell instead of floating too low.
- v1.3.79 keeps the production image viewer unchanged and coalesces Android keyboard inset state updates so IME animation frames stop re-rendering the chat shell on every intermediate step, while the final inset still lands exactly after the keyboard settles.
- v1.3.78 keeps the production image viewer unchanged and removes the remaining Android-side no-op composer auto-lift calls from focus, keyboard, and layout hooks, so chat input focus no longer keeps touching that dead path while the keyboard is opening.

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
- `src/lib/providerCapabilities.ts`
  - Pure capability inference for API profiles, covering protocol support, streaming, native attachments, reasoning, response chaining, system prompts, and future web search eligibility.
- `src/lib/profileDrafts.ts`
  - Pure helpers for editable API profile drafts, including the temporary empty Base URL state used while replacing preset URLs.
- `src/lib/files.ts`
  - Attachment picking/copying/cleanup.
  - Remote URL attachment download helpers.
  - Shared Android image URI persistence helper.
  - User-chosen chat export files, private storage location helpers, and raw startup-recovery backup export.
- `src/components/MessageBubble.tsx`
  - Chat bubble, Markdown rendering, compact copy button, long-press copy.
  - Uses drawn copy/check icons instead of font-dependent symbols.
  - Detects credential-like / technical text and renders it as a monospace horizontal block.
- `src/components/ImageAttachmentViewer.tsx`
  - Full-screen chat image viewer used by pending and conversation image attachments.
  - Production chat now uses the verified `@likashefqet/react-native-image-zoom` path here, wrapped for Android modal safety while keeping only the minimal close `X` chrome.
  - Used by both pending and conversation image attachments through the shared attachment preview path in `App.tsx`.
- `src/components/DrawerLabImageGestureExperiment.tsx`
  - Isolated Drawer Lab image experiment for future zoom work.
  - The inline sample stays tap-only, while the fullscreen lab viewer now delegates pinch/pan handling to `@likashefqet/react-native-image-zoom` through a single absolute overlay inside the lab instead of a second modal.
  - The lab overlay now includes a forced-active gesture root, a `2x` programmatic zoom probe, and visible interaction counters (`Int/Pinch/Pan/Dbl/Prog`) to separate host-event issues from zoom-surface issues during Android testing.
- `src/components/DrawerGestureLab.tsx`
  - The lab now swaps out the entire drawer/scroll host while the fullscreen image test is open, leaving only the fullscreen gesture surface for the current pinch-diagnosis round.
- `src/components/PendingAttachmentBar.tsx`
  - Presentational pending attachment chip rail used above the composer.
  - Keeps preview/delete callbacks owned by `App.tsx` while moving chip rendering styles out of the app shell.
- `src/components/ModelPickerContent.tsx`
  - Presentational model picker content used inside the existing bottom sheet.
  - Keeps fetch/switch/select/profile-editor behavior owned by `App.tsx`.
- `src/plugins/`
  - Internal content plugin registry.
  - `latexMath.ts` transforms common LaTeX/math/cryptography tokens into readable symbols.
- `assets/`
  - App icon source and generated Expo icon/splash/favicon/adaptive icon assets.
  - `icon-source.png.jpg` is the current source image for regenerated icon assets.
- `RELEASE_CHECKLIST.md`
  - Per-release checklist for GitHub APK publishing.
- `scripts/release-audit.mjs`
  - Final release consistency audit for version numbers, current release notes, README shape, upload-folder forbidden files, and 1.3.0 planning visibility.
- `release-notes/`
  - Local-only per-version change/test records and GitHub Release page drafts. Keep it ignored in `ai-chat-pocket-git` so the public repo stays small.
- `docs/ARCHITECTURE_PLAN.md`
  - Current architecture map, refactor rules, target layers, and staged version queue for future framework work.
- `android/app/src/main/java/com/fanshanng/aichatpocket/SharedImageModule.kt`
  - Native bridge for pending shared/dragged image URI events.
- `android/app/src/main/java/com/fanshanng/aichatpocket/MainActivity.kt`
  - Receives Android `SEND`, `SEND_MULTIPLE`, and root-view drag/drop image events.

## Persistence Details

- Legacy bundled state key: `ai-chat-pocket.state.v1`
- Conversation index key: `ai-chat-pocket.conversation-index.v1`
- Per-conversation key prefix: `ai-chat-pocket.conversation.v1.`
- Saved profile/config key: `ai-chat-pocket.profile-state.v1`
- State encryption key: `ai-chat-pocket.state-encryption-key.v1`
- Legacy API key: `ai-chat-pocket.api-key.v1`
- Per-profile API key prefix: `ai-chat-pocket.api-key.profile.`
- Attachments are copied to app-private storage before being sent.
- Old API profiles without `apiProtocol` normalize to `responses`.
- Conversations may now persist `lengthWarningAcknowledgedAt` so oversize warnings do not repeat on every send attempt.
- Chat storage now migrates away from the old single bundled state row into an encrypted conversation index plus one encrypted AsyncStorage record per conversation, so oversized chats can be isolated more safely in future recovery work.

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

## Codex Skills Workflow

Installed local skills that should be considered part of the normal development flow after Codex restart:

- `security-best-practices`
  - Use before security-sensitive work, release-boundary changes, storage/export changes, API key handling, attachment cache changes, signing/upload changes, or public release preparation.
  - Prefer a read-only review first, then make fixes in separate patch versions.
- `define-goal`
  - Use for multi-step framework work, `App.tsx` extraction, provider capability planning, context management, and other long-running architecture work.
  - Keep the goal scoped to one low-coupling direction and do not mix gesture, Markdown, storage, and UI refactors in one patch.
- `gh-fix-ci`
  - Use after GitHub Actions is added, or when a CI failure log needs diagnosis.
  - Do not add or rewrite CI broadly unless the current task is explicitly about CI.

Workflow reminder:

- If the user asks for security review, privacy review, release safety, signing/upload boundaries, API key/export behavior, or attachment storage, proactively use `security-best-practices`.
- If the user asks to plan a large refactor or continue the long-term framework plan, proactively use `define-goal`.
- If the user asks about CI, GitHub Actions, or failing checks, proactively use `gh-fix-ci`.
- These skills support the process; they do not replace the project rules for version bumps, standalone APK verification, selective Git sync, and no push/tag unless explicitly requested.
- Small recurring development papercuts may be fixed opportunistically when they clearly reduce repeated context/token waste and do not widen product risk. Examples: terminal/tooling defaults, output readability, local audit reminders, and other low-risk workflow friction.
- Opportunistic workflow fixes should stay small, be documented, and should not be mixed into high-risk gesture, Markdown, storage, or rendering changes unless they are tightly related.

## Next Optimization Queue

Recommended next tasks:

1. Follow `docs/ARCHITECTURE_PLAN.md`.
   Keep framework work small: extract presentational pieces first, then hooks, then provider capabilities.
2. Split `App.tsx`.
   Extract `ChatScreen`, `Composer`, `SettingsScreen`, `ModelPickerSheet`, `SessionDrawer`, `AttachmentMenu`, and related hooks in separate patch versions.
3. Continue v1.3.x patches from the current published baseline.
   Keep gesture and Markdown changes isolated, build standalone release APKs for device testing, and update local release records before syncing.
4. Provider-specific features.
   Use `src/lib/providerCapabilities.ts` before adding future web search, generated files, or provider-specific request parameters.
5. Rich generated files.
   Add provider-specific image generation and PDF/DOCX export. Current support covers downloaded image/document URLs only.
6. Conversation management.
   Add pin, batch delete, import, and share-sheet export.
7. Context management.
   Add recent-message windows, automatic old-message summaries, and per-provider token/attachment limits.
8. Security polish.
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

Current v1.3.106 APK SHA-256:

```text
8194EBC20789400357B48F709C672A33E4009B8EED3DB5F0CD14CC56996E43C5
```

Previous v1.3.105 APK SHA-256:

```text
FA9FCC9363A37C9E8CAA32F31E3CC1661A42038C1722567A5BF0D8D26F6AD1CE
```

Previous v1.3.96 APK SHA-256:

```text
B2DF4BB5D0C3876A4F2F33D8E869A41D77B4ED9E1824F91D497091B732F79178
```

Previous v1.3.95 APK SHA-256:

```text
40A5069F1B39FFC0234936F2340FBD7E81FA8FAD507086F877CF9E92D467BD42
```

Previous v1.3.94 APK SHA-256:

```text
33D9048AEBF229F709E283C681B5EB5B2CF3AA9E5C914F65BC7F58BBE8127094
```

Previous v1.3.93 APK SHA-256:

```text
E12C0B9DC8B54F11CF94288C8153F16754A63D55E509D470BC80A5FDCEA0EC8F
```

Previous v1.3.92 APK SHA-256:

```text
B9E406DEC336B2273AE85B71FB38A018CB33F5AECAF0707F29F4A0AECCA22AE5
```

Previous v1.3.91 APK SHA-256:

```text
FDF34E77769CC62C4688AE38FA540E7FA560504CD07A7DBE00205F8F34D214EC
```

Previous v1.3.90 APK SHA-256:

```text
9E836DD0714B6AC52226515C36F0EA215C89AAC4C8A4DC4DC680A85FBC962BA9
```

Previous v1.3.89 APK SHA-256:

```text
14C507F45A07E79655E33972A99AFA3AF474B6074FFD78DFA72D51B6776E5402
```

Previous v1.3.88 APK SHA-256:

```text
6244D7DD0319E37824893CD144903CD79A7EB6692A166755E4365157052F6A40
```

Previous v1.3.87 APK SHA-256:

```text
7E13A499AA294A70F86F79363889D15AC88B933A6FE3BD873DCD13F6D2CF4A3D
```

Previous v1.3.86 APK SHA-256:

```text
B32B06A3BCFD7346889A1C45F3FACE6691A6F1AFD331F79250B586279166DAF0
```

Previous v1.3.85 APK SHA-256:

```text
94226FAE87982040484CB0BE9A954E3CBF201EEE6692DFB6F0480595CBF79DBA
```

Previous v1.3.84 APK SHA-256:

```text
5BAF1E5C62668D408DF678112D5C3D55865B418B1CDEA6C1BBDF3BA2EAEABC82
```

Previous v1.3.83 APK SHA-256:

```text
ABF27D2F04C196A32EB8CE8C427933E4220AB82DD8C84ACA8604D842DE98C8E3
```

Previous v1.3.82 APK SHA-256:

```text
22CEBAC7E7B527F3F0B18F07FFF630EC27C23252E3CC886C026DD092CC111565
```

Previous v1.3.81 APK SHA-256:

```text
FBF76D0231523AE0B85355979ED3DC5C6FC7B6059BAAAE189225B2756B049C34
```

Previous v1.3.80 APK SHA-256:

```text
76B220D8FECABA1A886F1A554CDC9397382681F19F65EC146F39E2123C9AF0BA
```

Previous v1.3.79 APK SHA-256:

```text
FDE3C3D2EE61B665AE205FFF185A5C5CF034AFDDA3184406D5B1D05FE1BCD5A1
```

Previous v1.3.78 APK SHA-256:

```text
509CBD5DCBF5F10FB3C0F8F3412AA830B6693AFBF0E67943A06AD3EE05CD17AC
```

Previous v1.3.77 APK SHA-256:

```text
605D5CF2BFBFE589030A5B95703C61E0477E734EA33D55F6A526952F8C908A46
```

Previous v1.3.76 APK SHA-256:

```text
A6EB985DA82A5FB57A29D15EBFF6445C58AFDE3B0222A17F4CB87B1F38769C07
```

Previous v1.3.75 APK SHA-256:

```text
4E97741F2943238A06936B4C9181C20BA6B32620E151A9C3371FC37DEC280E87
```

Previous v1.3.74 APK SHA-256:

```text
510324F6A2DF5178A5A493FA11D1AF61799F73AD37B8FA02320ECCCFA6800742
```

Previous v1.3.73 APK SHA-256:

```text
0328297F7AA49280BC9DEFD488566D207B5A442C8F28E038474256676F08C876
```

Previous v1.3.72 APK SHA-256:

```text
596A64678B805F922FDE08991FC6F7A59A362DB0578428B3D375D2FB796DD134
```

Previous v1.3.71 APK SHA-256:

```text
BC7E4382EFAFB98E8955143B84B404A96CF132D799FC6E96ADF1FBED0CC679BC
```

Previous v1.3.70 APK SHA-256:

```text
67922B93F0F9E738C69FF56C35FAEDF2EC50707D30FB395AD5177C2D84516506
```

Previous v1.3.69 APK SHA-256:

```text
C0A3EFE66461FE0780AC217DA236DD6BAB68A066D056D01F420257DDCC09E685
```

Previous v1.3.68 APK SHA-256:

```text
DA886BF2CFEF5603810C99FB8E0C7860355AB8C8D3A01F9FC050FFD02CDF6E78
```

Previous v1.3.67 APK SHA-256:

```text
E976C87AF25A97242E9B97C34E3FB35F2DC8E93FD0D8CDEE1C8FDF3F8ABA368C
```

Previous v1.3.63 APK SHA-256:

```text
8BCF2CED5B9D4F1FAEB512A0C68E4DA71E379B9362B9E43793406A0FD3960CE7
```

Previous v1.3.62 APK SHA-256:

```text
E22E3AA5023C38DA268CFA1B43361EB05ABF54B7F6D993A743526EFA3A2F9209
```

Previous v1.3.39 APK SHA-256:

```text
40C306C4BF77891A56DC24D05AABCD18824D4557769E5A1C5D29350B4B6966D1
```

Previous v1.3.38 APK SHA-256:

```text
DAB9EA0ED6577E3FB214BD2EA395972E931C2C848B75B2BB75ADA8A652992C45
```

Previous v1.3.37 APK SHA-256:

```text
22327497453E1C098A076954E8DB12ECB6CC36A9A83E1DD71AB8578CE0DD234B
```

Previous v1.3.36 APK SHA-256:

```text
BF8870A933328CF58942EC8DC7EED24C16E6A1DE5E30AE5F9079EF7AF83A5064
```

Previous v1.3.34 APK SHA-256:

```text
253ECD99FAF0A200E8BE1CFBFEAC043A86C2D82707A028B36939FA25135AEF7B
```

Previous v1.3.33 APK SHA-256:

```text
08D1790014B3CC1B2907131067792E8A97F11445B246CEA95BA1B46CC55967FA
```

Previous v1.3.32 APK SHA-256:

```text
2A4D719075A71EF16F58F60E4814AD873889C4B96852DE4FDAB36D8ACA8D0FFE
```

Previous v1.3.31 APK SHA-256:

```text
0068F8CF79C9CEF3473D67D24DC01342CFD97C351FD01574834E1225E56EA4BF
```

Previous v1.3.30 APK SHA-256:

```text
0F9102023C6FE486005EB2BFFFD7032FB15C2CBA6A2DF569B698D518A2CB136C
```

Previous v1.3.29 APK SHA-256:

```text
896A15C6A2B442C9B508F0C8CD10B9FE8DB77408D9B64EC18FE7790A671120FB
```

Previous v1.3.28 APK SHA-256:

```text
376DBCA23C055BCBDF66D2B5B6EB10C0E802436953B035257AD032923BE72C3B
```

Previous v1.3.27 APK SHA-256:

```text
13DB658E958C35D3D56758FA71E998E08B79FE86B2773CD303C8B95BDE9966B3
```

Previous v1.3.26 APK SHA-256:

```text
B728A707A70F10734C6C131526EEAA586041FAE39E73696F1B0546286FADEC8A
```

Previous v1.3.25 APK SHA-256:

```text
DEC59B20D2DA879899BA13E0C356B2471FB2DBB689E3B1F3C9889D1D2D1246A4
```

Previous v1.3.24 APK SHA-256:

```text
D849E34BF2BC87526B100A65DC0148F191C7B1BE8901D642AB42C00BA5B8618B
```

Previous v1.3.23 APK SHA-256:

```text
C0BF2B6F78E69FBEF727EA5ED02A6F6CABFC180701AFE082C1D6D88BB6185675
```

Previous v1.3.22 APK SHA-256:

```text
E049322806149A1626DA29634FFE6F314D49DACD1CBCF775784910D3A7E34C11
```

Previous v1.3.21 APK SHA-256:

```text
76342ED72BC4B9EC86F9E1681AF6FA016737B37F755AC3EB2736D39C3B72B398
```

Previous v1.3.20 APK SHA-256:

```text
97C7BDEFDD659F64E9135A94A693F68CB4B36055AB683949E62AC216B71F5D26
```

Previous v1.3.15 APK SHA-256:

```text
057AD9CF1042501F1672282F84874329600ADD78BD423564C1BC6CACB625CAA7
```

Previous v1.3.14 APK SHA-256:

```text
755C5B9FD927E9E57C734FB5D5F4335DB50B0244E3F225E387411B25EDD40E1D
```

Previous v1.3.13 APK SHA-256:

```text
7158B4B9DE307E934BCA78047942DFC155049C7DC37AB9AF5B327C5E4AC71B75
```

Previous v1.3.12 APK SHA-256:

```text
7E643205982B878CF745720D5C43B931435BAB19DAF60FA147F74EA9BDB57505
```

Previous v1.3.11 APK SHA-256:

```text
D104C8B125A77E086A273F70C755555BB51B58413D7A1658F8236DCFAF00C74A
```

Previous v1.3.10 APK SHA-256:

```text
C78C84271C61664982B6B9BD5CC93B3821CED3D642D8F632C058EDA161F608B7
```

Previous v1.3.9 APK SHA-256:

```text
BCB7EB3704FA6BEEAE0FC5086AB90671CF82F066A872E473B149671BFAE8B4C7
```

Previous v1.3.7 APK SHA-256:

```text
9E7CC7647B624B32EE6B9A164EA8C7E5783B375855EE231402C9130FCE0EA533
```

Previous v1.3.6 APK SHA-256:

```text
EDADF729C0765DB5A2511D24B0C00D6971D57EE1BB8F2E1EF40F0C102722ADCA
```

Previous v1.3.5 APK SHA-256:

```text
883DAB647703270EE1C779D42E9214BD1A019CAD4BC78C734C85399F1EEFAC1B
```

Previous v1.3.4 APK SHA-256:

```text
4CFFAE5DA2B08A1206E01641DBFC746C6BA4190EBB3F78F47F956E5D54AAB00B
```

Previous v1.3.3 APK SHA-256:

```text
F502FD612506F369BBC4813F0041A73843B9CB94A84FBCA1FA9563C53A7676AC
```

Previous v1.3.2 APK SHA-256:

```text
EE9C8027CD0243066963A8A2DFC7403107A50812BFEF5D4D311E07D41169B6CD
```

Previous v1.3.1 APK SHA-256:

```text
A85196EF5F2A592D5DE22A6C4D080912AEB025F421C3D91E52E3D476CAD4793D
```

Previous v1.3.0 APK SHA-256:

```text
BA190AD8DA21B9DBB82B164CAC48536F3C2345D9EB63B52C61F063411F6B735D
```

Previous v1.2.27 APK SHA-256:

```text
3BD63EEB2549A60929C63A93E2E254186ADAA558468EDBA44D8A921390E5B6A3
```

Previous v1.2.26 APK SHA-256:

```text
BFDF485FB69E45AE6621E69FBB848F176FDAC1131367799992B065FCA5AF058D
```

Previous v1.2.25 APK SHA-256:

```text
8232D523A26E891D727EC67C75CC5984A9F8B575B2D7B882D60F6AEEF77DA4BD
```

Previous v1.2.24 APK SHA-256:

```text
D564858352D2C1692AFEC5DCC30868ADD6293D44B5AE21654C56D1B50FC37799
```

Previous v1.2.23 APK SHA-256:

```text
7F0F5366593612BBECD745F82887D010545A6D7F49B2A93BDB50AE206E336E6D
```

Previous v1.2.22 APK SHA-256:

```text
C72FF948C5D988BC276835083507E119DF396453F361E8EA5A8A4968590FB103
```

Previous v1.2.21 APK SHA-256:

```text
5267DD35DD44520C2A80BCA5199A03AC9B15666226C7CAB4D46CB6034FA32F98
```

Previous v1.2.20 APK SHA-256:

```text
3D82EEAFEDAB29FE889FD267D6C5B7CA409C30B0C8A468A8E77659EAC414EC96
```

Previous v1.2.19 APK SHA-256:

```text
EF185FD327AB08336599AD90ACC9358382CC3516C0F357C87DFDB8EFF1AA459C
```

Previous v1.2.18 APK SHA-256:

```text
EA483297B43BC0AA644064E8A1173C36F25D4F0F3A7F48618AEE9CA90BFDB416
```

Previous v1.2.17 APK SHA-256:

```text
FC37B9508A5B07EE694BD6520E66CB31AB6BC5DADAF1E3B687F6C0C691445D5F
```

Previous v1.2.16 APK SHA-256:

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

Current GitHub sync note:
- The local mirror still points to `ssh://git@ssh.github.com:443/fanshanng/Pocket-AI.git`.
- As of 2026-06-30, direct remote access from this machine failed with `Permission denied (publickey)`.
- Do not push the private source snapshot until repository visibility and GitHub auth are both confirmed.

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

- The old React Native `SafeAreaView has been deprecated` runtime warning was cleared in v1.3.47 by migrating app-owned usage to `react-native-safe-area-context`.
- Startup log may still show non-fatal safe-area manager `ViewManagerPropertyUpdater` warnings from the underlying RN/native stack; these are separate from the old deprecated SafeAreaView JS warning.
- Android Gradle build requires Java 17+. This machine has used `D:\JAVA\jdk-21.0.2.13-hotspot`.
- Some remaining Gradle deprecation warnings still come from Expo / React Native dependencies under `node_modules/`; v1.3.48 only clears the app-owned Groovy space-assignment warnings in our own build files.
- Release APK signing uses local-only `android/keystore.properties` and ignored signing backups in `LOCAL_PRIVATE/signing/`. These files are intentionally ignored by Git and must be backed up offline.
- The Gradle wrapper may try to download Gradle when using `--rerun-tasks`; if the sandbox blocks network, rerun with approved escalation.
