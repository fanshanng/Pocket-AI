# External APK Sensitive Content Analysis

Date: 2026-06-25

## Purpose

This note records a static analysis pass over an external Android APK in order to understand how that app appears to handle sensitive content detection, moderation, and policy enforcement.

The target file analyzed was:

- `D:\Desktop\新建文件夹\2.2.Apk`

This document is for learning and architectural reference only. It is not a claim about the exact runtime behavior of the target app in every scenario.

## Scope

The goal of this analysis was not to fully reverse engineer the application. The narrower goal was:

- identify whether the app uses local keyword filtering, prompt-based guardrails, proxy interception, or server-side moderation
- collect concrete evidence from the APK package
- infer the likely moderation pipeline
- extract implementation lessons that are useful for `ai-chat-pocket`

## Analysis Method

Because the local machine did not have `jadx` or `apktool` available at analysis time, the inspection was done with a lightweight static workflow:

1. copy the APK to an ASCII-only temporary path
2. inspect package metadata with `aapt`
3. unzip the APK and inspect `assets`, `AndroidManifest.xml`, and `classes.dex`
4. search strings inside unpacked assets and dex files with `rg`
5. correlate visible policy text, prompt assets, and bridge/proxy strings

Temporary working paths used during analysis:

- `E:\android\tmp_apk_ascii\target.apk`
- `E:\android\tmp_apk_probe`

## Basic Package Facts

From `aapt dump badging`, the package metadata was:

- package name: `com.gamedeveloper.urbanfriendshipstory`
- app label: `妹居物语`
- version name: `2.2.2`
- version code: `42`
- target SDK: `34`

This already suggested a hybrid app structure because the package contained:

- a large `assets` directory
- `index.html`
- WebView-facing assets
- local bridge/log strings inside `classes.dex`

## High-Confidence Findings

### 1. The app explicitly defines prohibited content categories in the UI/policy layer

In the unpacked [index.html](</E:/android/tmp_apk_probe/assets/index.html:729>) file, the app lists prohibited content such as:

- sexual content
- sexualized minors or minor-coded characters
- crime instruction
- violent extremism and hate content
- privacy violations
- illegal or fraudulent content

The same area in [index.html](</E:/android/tmp_apk_probe/assets/index.html:735>) states that violating content may be blocked, deleted, logged, or lead to account bans and reporting.

This does not prove technical enforcement by itself, but it confirms that moderation is a designed product concern rather than an accidental afterthought.

### 2. The app contains a visible moderation / filtering initialization hook

In [index.html](</E:/android/tmp_apk_probe/assets/index.html:2067>) there is a comment indicating:

- `初始化屏蔽词过滤器`

This strongly suggests that at least one client-side text filtering layer exists, likely to provide immediate feedback before or during chat submission.

### 3. The APK includes prompt assets that look like behavior-control building blocks

The package contains a dedicated prompt asset directory:

- [dirty.md](</E:/android/tmp_apk_probe/assets/assets/AI/prompt/dirty.md:1>)
- multiple role prompt JSON files under `assets/assets/AI/prompt/...`

The presence of [dirty.md](</E:/android/tmp_apk_probe/assets/assets/AI/prompt/dirty.md:1>) is important because it shows the app ships extra prompt material as data files rather than hardcoding everything inside app logic.

That file did not look like a classical banned-word list. It looked like a text instruction payload for model behavior. This makes a pure local word blacklist much less likely to be the main moderation mechanism.

### 4. The dex strings indicate request interception and bridge-level control

String searches inside [classes.dex](</E:/android/tmp_apk_probe/classes.dex>) surfaced several notable messages:

- `收到API请求`
- `收到流式API请求`
- `流式响应状态码`
- `拦截阿里云API请求`

These strings are consistent with an internal proxy or bridge layer that can:

- receive and inspect outbound chat requests
- intercept specific provider calls
- observe streaming responses
- log request and response events

This is a major clue that moderation is not only happening in front-end JavaScript or prompt files.

### 5. The app appears to be a hybrid WebView-style shell with native bridges

The asset layout and dex strings strongly suggest a hybrid architecture:

- UI/content in `index.html` and related web assets
- Android-side bridges handling storage, request routing, and device features
- native or JVM-side request interception before final upstream delivery

That architecture makes it easy to inject policy at multiple stages:

- before the prompt is built
- after the prompt is built but before network submission
- after model output starts streaming back

## What Was Not Found

The analysis did not reveal a clean, obvious standalone sensitive-word dictionary such as:

- `sensitive_words.txt`
- `banlist.json`
- `illegal_words.db`

That absence matters. It does not mean there is no local list. It means the moderation strategy does not look like a single transparent local keyword database being used as the primary control point.

## Likely Moderation Architecture

Based on the combined evidence, the most likely moderation pipeline is a layered one:

1. policy declaration layer
2. local pre-check layer
3. prompt guardrail layer
4. proxy or bridge interception layer
5. response-side post-check layer

### 1. Policy declaration layer

The app openly declares prohibited content categories in the UI and policy pages. This serves legal, UX, and enforcement framing purposes.

### 2. Local pre-check layer

The `屏蔽词过滤器` initialization comment suggests some kind of local content filter for user input. This layer is likely used for:

- instant blocking of obvious prohibited phrases
- lightweight user feedback
- reducing unnecessary upstream requests

### 3. Prompt guardrail layer

The prompt asset structure indicates that role instructions and possibly safety constraints are loaded from external files and composed dynamically.

This is useful for:

- controlling persona behavior
- embedding refusal boundaries
- changing safety behavior without recompiling every logic branch

### 4. Proxy or bridge interception layer

The dex strings imply that requests are not necessarily passed straight from web UI to upstream model APIs. Instead, they likely pass through a native layer that can:

- inspect payloads
- rewrite requests
- add policy constraints
- block or reroute requests
- log moderation-relevant events

### 5. Response-side post-check layer

The presence of streaming response log strings suggests there is an opportunity to inspect generated content after the model starts responding.

That would allow the app to:

- stop rendering unsafe content
- cut off a stream mid-generation
- replace content with fallback warnings
- store logs for audit or abuse handling

## Best-Fit Interpretation

The strongest interpretation is:

- this app does not rely mainly on a simple local sensitive-word table
- it likely uses a mixed moderation system
- prompt engineering and request interception appear more central than a plain blacklist

In other words, the app looks closer to:

- `light local filter + prompt constraints + bridge/proxy enforcement + output monitoring`

than to:

- `single on-device banned words file`

## Why This Matters for Our Project

For `ai-chat-pocket`, this analysis suggests a useful principle:

- do not trust one moderation layer to do all the work

Each single approach has a weakness:

- local keyword-only filtering is easy to bypass
- system prompt-only safety is soft and inconsistent
- server-only moderation is too late for some UX cases
- output-only moderation does not reduce bad requests

The safer design is layered moderation.

## What Is Worth Learning

### Good ideas worth borrowing

- make moderation a product feature, not an invisible hack
- keep safety rules data-driven where possible
- separate policy text from business logic
- allow interception before upstream requests leave the device
- consider post-generation safety checks, not only input checks

### Ideas that should be used carefully

- hiding too much moderation logic inside opaque prompt files
- relying heavily on WebView-side logic for enforcement
- using bridge-layer interception without clear local ownership and observability

### Ideas that are not enough on their own

- a user agreement alone
- a single blacklist
- a system prompt with no enforcement layer

## Suggested Moderation Model for `ai-chat-pocket`

If we later add moderation to `ai-chat-pocket`, this APK suggests a three-layer minimum:

1. input pre-check
2. request-time guardrail
3. output post-check

### Input pre-check

Use lightweight local checks for:

- obviously illegal sexual/minor content
- direct self-harm incitement
- violent crime instructions
- privacy leaks

This is mostly for fast UX feedback and preventing wasteful API calls.

### Request-time guardrail

Centralize moderation in the request pipeline, ideally near:

- [openai.ts](/E:/android/projects/ai-chat-pocket/src/lib/openai.ts)

This layer should decide whether the request can be sent at all.

### Output post-check

Inspect model output before full display. This is especially useful for:

- streaming responses
- roleplay drift
- code-switched or indirect violations

## Important Cautions

### Static analysis limitations

This analysis was static, not dynamic. That means:

- some features may be inactive at runtime
- strings may be dead code
- true enforcement may happen server-side where the APK gives limited visibility

### No exact method-level attribution yet

Because `jadx` and full decompilation tooling were not available in this pass, the analysis did not identify:

- exact Java/Kotlin class names responsible for filtering
- exact invocation order between UI, bridge, and upstream API
- exact policy matching algorithm

The conclusions in this document are therefore evidence-based inferences, not full source reconstruction.

### Legal and ethical caution

Reverse engineering third-party software may raise legal or license concerns depending on jurisdiction and usage. This note is intended for internal learning and architectural comparison only.

## Practical Takeaway

The most important lesson from this APK is not a specific banned-word list. It is the architecture pattern:

- moderation is layered
- some checks are probably local
- prompt files shape behavior
- requests appear to pass through an interceptable native bridge
- output likely remains observable after submission

That is a more realistic pattern for AI chat safety than a single filter file.

## Evidence Index

Key evidence locations from this analysis:

- policy restrictions: [index.html](/E:/android/tmp_apk_probe/assets/index.html:729)
- block/delete/ban wording: [index.html](/E:/android/tmp_apk_probe/assets/index.html:735)
- review/delete/log/ban wording: [index.html](/E:/android/tmp_apk_probe/assets/index.html:748)
- filter initialization comment: [index.html](/E:/android/tmp_apk_probe/assets/index.html:2067)
- prompt asset example: [dirty.md](/E:/android/tmp_apk_probe/assets/assets/AI/prompt/dirty.md:1)
- request interception and stream logging strings: [classes.dex](/E:/android/tmp_apk_probe/classes.dex)

## Appendix: Commands Used

Representative commands used during the analysis:

```powershell
& 'E:\android\.devtools\android-sdk\build-tools\36.0.0\aapt.exe' dump badging 'E:\android\tmp_apk_ascii\target.apk'

rg -a -n -F -C 4 "dirty.md" E:\android\tmp_apk_probe

rg -a -n -e "违规|敏感|审核|过滤|屏蔽|policy|moderation|safety" E:\android\tmp_apk_probe

rg -a -n -F -C 2 "拦截阿里云API请求" E:\android\tmp_apk_probe\classes.dex
```

## Summary

This APK appears to implement sensitive-content handling as a layered moderation system rather than a single local keyword list.

The strongest signals point to:

- visible policy constraints
- local filter initialization
- prompt-asset-based behavioral control
- request interception in a bridge/proxy layer
- response observability during streaming

For our own project, the best takeaway is to design moderation as a pipeline, not a single rule file.
