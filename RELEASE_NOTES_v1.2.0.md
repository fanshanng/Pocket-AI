# Pocket AI v1.2.0

`v1.2.0` focuses on the chat reading experience. The main goal of this release is to make Markdown, code blocks, tables, and long LaTeX formulas reliable on real Android devices while keeping the existing local-first chat, API profile, attachment, drawer, and release signing behavior unchanged.

## Update Summary

- Reworked Markdown rendering around `react-native-markdown-display` and `markdown-it` so headings, lists, quotes, tables, inline code, code fences, and math blocks render through a more stable native-first path.
- Improved code block rendering with a dedicated `CodeBlock` component, syntax highlighting, copy feedback, full-screen viewing, and safer fallback behavior during streaming output.
- Fixed the issue where sending a second message after a generated code block could leave a large blank area or make the chat appear frozen.
- Stabilized long LaTeX display formulas by isolating them in their own horizontal scroll area and rendering the formula content through KaTeX.
- Stabilized wide Markdown tables by giving tables their own horizontal scroll container and keeping columns aligned on mobile screens.
- Tuned nested scroll and gesture handling so tables, code blocks, and formulas can scroll horizontally without taking over normal vertical chat scrolling.
- Preserved the current drawer behavior while reducing gesture conflicts between chat scrolling, drawer swipes, and rich message content.
- Updated release metadata to app version `1.2.0` and Android `versionCode 35`.

## Main Changes

### Markdown and Math

- Added a math-aware Markdown parser path for `\(...\)`, `\[...\]`, and `$$...$$`.
- Rendered block formulas with KaTeX in a measured WebView, wrapped by a React Native horizontal scroll container.
- Added fallback behavior so malformed or unfinished Markdown/LaTeX during streaming does not crash the message renderer.
- Kept inline math readable with a lightweight text fallback where native inline rendering is safer than embedding WebView content inside text flow.

### Tables and Code Blocks

- Wide Markdown tables now keep row and column layout aligned and can scroll horizontally.
- Code blocks keep indentation, support copy actions, and remain usable with long content.
- Horizontal scroll areas are isolated so users can inspect wide content without losing normal chat navigation.

### Stability

- The Markdown renderer remains wrapped by an error boundary.
- Streaming output handles unfinished code fences and unfinished math more safely.
- Android release build has been verified after the rendering and gesture changes.

## Verification

- `cmd /c node_modules\.bin\tsc.cmd --noEmit`
- `npm run smoke`
- `cmd /c gradlew.bat assembleRelease`
- Release APK SHA256: `448A8F45C7D894FF463E1C9EEB000A38AD0E836C6C3DCDE2A549439AA4C82D3A`
- Release signing certificate SHA256: `9818729430986A531F0AC5E68B526DC019BC68A8320273306B6635436E939DB1`

## Notes

- This release does not include `node_modules`, Android build outputs, APK files, Gradle caches, local signing files, logs, screenshots, local user data, or secrets in Git.
- Users still need to provide their own API key and compatible model endpoint.
- This app is not an official OpenAI, DeepSeek, or model provider product.
