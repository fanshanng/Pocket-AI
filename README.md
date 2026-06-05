# Pocket AI

Pocket AI 是一个基于 Expo / React Native / TypeScript 的移动端 AI 聊天应用。

它直接在手机端请求 OpenAI 兼容接口，支持文本、图片、文件输入，并将聊天记录保存在本机。正常安装使用不需要电脑端常驻进程，也不需要 Metro/LAN。

## 功能

- 白色移动端聊天界面。
- 支持多个 API 配置，完成后自动保存并应用。
- API 配置支持一键测试连接。
- 支持 OpenAI Responses API。
- 支持 DeepSeek / Chat Completions 兼容接口。
- 支持实时流式回复和停止生成。
- 支持文本、图片、文件附件输入。
- 支持 Android 图片分享、多图分享、分屏拖入图片。
- 支持消息复制和长按复制。
- 密码、API Key、Token、URL、命令等内容会以等宽块显示。
- 会话支持搜索、重命名、删除和复制 Markdown 导出。
- 常见 API 错误会显示更清楚的中文提示。
- 聊天记录、API 配置和附件保存在本机。

## 本地存储

- API Key：系统 SecureStore / Android Keystore。
- 聊天记录和配置：加密后保存到本机 AsyncStorage。
- 附件：复制到应用私有文件目录。

卸载应用或清空本地数据会删除这些内容。

## API 示例

DeepSeek：

```text
接口类型：Chat Completions compatible
Base URL：https://api.deepseek.com
模型：deepseek-v4-flash
Project ID：留空
Organization：留空
```

OpenAI：

```text
接口类型：OpenAI Responses
Base URL：https://api.openai.com/v1
模型：gpt-5.4
Project ID：可选
Organization：可选
```

## 开发

```powershell
cd E:\android\projects\ai-chat-pocket
npm install
```

类型检查：

```powershell
cmd /c node_modules\.bin\tsc.cmd --noEmit
```

构建 Android APK：

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
cmd /c gradlew.bat assembleRelease
```

APK 输出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

## 说明

本项目计划保持私有/闭源。

日常开发目录：

```text
E:\android\projects\ai-chat-pocket
```

选择性 Git 上传目录：

```text
E:\android\projects\ai-chat-pocket-git
```

选择性目录只同步源码、配置、文档和必要资源，不同步 `node_modules`、构建产物、本地 SDK 路径、私钥、日志或用户数据。
