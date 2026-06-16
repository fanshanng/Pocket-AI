# Pocket AI v1.2.4

Pocket AI 是一个 Android 本地优先的 AI 聊天应用。它直接连接你自己配置的 OpenAI 兼容接口，支持文字聊天、图片输入、拍照、文件附件、流式回复、代码块复制、Markdown 表格和公式显示。

## 下载

请下载本页面附件中的：

```text
app-release.apk
```

首次安装 APK 时，需要在 Android 系统中允许从浏览器或文件管理器安装未知来源应用。

## 本版说明

- 将附件菜单移动到输入栏上方，避免菜单贴近 Android 导航栏。
- 增大附件按钮和附件菜单项的点击区域。
- 暗色模式下附件 `+` 激活态保持可读。
- 保留现有抽屉手势、模型选择、Markdown 表格、公式和代码块横向滚动逻辑。

## 使用

1. 安装并打开 Pocket AI。
2. 打开左侧菜单，进入设置。
3. 新增或编辑 API 配置。
4. 填入接口类型、Base URL、模型名和 API Key。
5. 保存后回到聊天页开始对话。

常见配置：

```text
DeepSeek
接口类型：Chat Completions compatible
Base URL：https://api.deepseek.com
模型：deepseek-v4-flash

OpenAI
接口类型：OpenAI Responses
Base URL：https://api.openai.com/v1
模型：gpt-5.4
```

## 校验

APK SHA256：

```text
8CBE1EEA2E85B84143BD9DAA8798821D971C977F100A12D850E126D3CA682F5C
```

签名证书 SHA-256：

```text
9818729430986a531f0ac5e68b526dc019bc68a8320273306b6635436e939db1
```

## 说明

- 用户需要自备 API Key。
- 聊天记录、附件缓存和 API 配置保存在本机。
- API Key 使用系统安全存储保存。
- AI 输出可能不准确，请自行判断重要内容。
- 本应用不是 OpenAI、DeepSeek 或其他模型服务商的官方产品。
