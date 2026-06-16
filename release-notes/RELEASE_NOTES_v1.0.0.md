# Pocket AI v1.0.0

第一个正式 APK 版本。

## 主要功能

- Android 本地优先 AI 聊天应用。
- 支持多个 OpenAI 兼容 API 配置。
- 支持顶部快速切换模型，并可通过 `/models` 或 `/model` 获取可用模型。
- 支持 OpenAI Responses API 和 Chat Completions 兼容接口。
- 支持实时流式回复、停止生成，并优化长回复生成时的滑动体验。
- 支持文本、拍照、图片、文件附件输入。
- 支持回复中的每个代码块单独复制。
- 支持 Android 图片分享、多图分享和分屏拖入图片。
- 支持左侧会话抽屉、会话自动命名、搜索、重命名、删除和 Markdown 导出。
- 支持中英文界面实时切换。
- 内置 LaTeX/密码学公式清理插件。
- API Key 保存在 SecureStore / Android Keystore，本地聊天数据加密保存。

## 安装

下载 `app-release.apk` 后安装。首次安装可能需要在 Android 系统中允许浏览器或文件管理器安装未知来源应用。

## 校验

APK SHA256：

```text
C2CFD2D18AE46AAB1BC957E63D473341F00B662DA577A15FD254E7DD0EB4E15A
```

签名证书 SHA-256：

```text
83e92deba5be48ebe1276107117ee9dee551b68971e75f5d3bee3404aa1e88b0
```

## 说明

用户需要自备 API Key。AI 输出可能不准确，请自行判断重要内容。本应用不是 OpenAI、DeepSeek 或其他模型服务商的官方产品。
