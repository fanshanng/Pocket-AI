# Pocket AI

Pocket AI 是一个 Android 本地优先的 AI 聊天应用。

它直接连接你自己配置的 OpenAI 兼容接口，支持文字聊天、图片输入、拍照、文件附件、流式回复、代码块复制、Markdown 表格和公式显示。正常安装使用不需要电脑端常驻进程，也不需要 Metro/LAN。

## 下载

- 最新版本：https://github.com/fanshanng/Pocket-AI/releases/latest
- 包名：`com.fanshanng.aichatpocket`
- 当前版本：`1.2.4`
- APK 文件：`app-release.apk`
- APK SHA256：`8CBE1EEA2E85B84143BD9DAA8798821D971C977F100A12D850E126D3CA682F5C`

首次安装 APK 时，需要在 Android 系统中允许从浏览器或文件管理器安装未知来源应用。

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

## 数据

聊天记录、附件缓存和 API 配置保存在本机。API Key 使用系统安全存储保存，不会写入导出文件或上传到仓库。
