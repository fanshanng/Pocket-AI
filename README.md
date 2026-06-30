# Pocket AI

Pocket AI 是一个 Android 本地优先的 AI 聊天应用。它直接连接你自己配置的 OpenAI 兼容接口，支持文字聊天、图片输入、拍照、文件附件、流式回复、代码块复制、Markdown 表格和公式显示。

正常安装使用不需要电脑端常驻进程，也不需要 Metro/LAN。

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

## 发布

- GitHub 仓库后续只用于 Release 发布，不再同步后续开发源码。
- 项目后续按闭源模式维护，GitHub 仅作为 APK Release 发布入口，不再默认公开同步源码更新。
- 最新 APK、更新说明和 APK SHA256 以 GitHub Releases 页面为准。
- 本地开发会继续独立迭代；如需同步私有源码快照，应先确认仓库可见性已切换为私有后再 push。
