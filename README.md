# Pocket AI

Pocket AI 是一个 Android 本地优先 AI 聊天应用，基于 Expo / React Native / TypeScript 开发。

应用直接连接用户自己配置的 OpenAI 兼容接口，支持文本、图片、文件附件输入。聊天记录、API 配置和附件保存在本机；正常安装使用不需要电脑端常驻进程，也不需要 Metro/LAN。

## 功能

- 多 API 配置，支持 OpenAI Responses API 和 Chat Completions 兼容接口。
- 实时流式回复、停止生成、消息复制、长按复制。
- 文本、图片、文件附件输入，支持 Android 分享图片、多图分享和分屏拖入图片。
- 会话搜索、重命名、删除和 Markdown 导出。
- 内置内容插件系统，当前包含 LaTeX/密码学公式清理插件。
- 中英文界面实时切换，API 配置完成后自动保存并应用。
- API Key 保存在 SecureStore / Android Keystore，本地聊天数据加密保存。

## 下载

正式版 APK 将通过 GitHub Releases 发布。

- 包名：`com.fanshanng.aichatpocket`
- 当前版本：`1.0.0`
- APK 文件：`app-release.apk`

首次安装需要在 Android 系统中允许从浏览器或文件管理器安装未知来源应用。

## 使用

1. 安装 APK。
2. 打开设置，新增或编辑 API 配置。
3. 填入 Base URL、模型名和 API Key。
4. 点击完成后配置会自动保存并应用。
5. 回到聊天页开始对话。

常见配置示例：

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

## 隐私

- 用户自备 API Key，应用不内置官方密钥。
- 用户输入、附件和上下文会发送到用户配置的 API 服务商或代理网关。
- 卸载应用或清空本地数据会删除本机保存的聊天记录、配置和附件。
- 本应用不是 OpenAI、DeepSeek 或其他模型服务商的官方产品。

