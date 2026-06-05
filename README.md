# Pocket AI

Pocket AI 是一个基于 Expo / React Native / TypeScript 的 Android AI 聊天应用。

它直接在手机端请求用户配置的 OpenAI 兼容接口，支持文本、图片、文件输入，并把聊天记录保存在本机。正常安装使用不需要电脑端常驻进程，也不需要 Metro/LAN。

## 当前版本

- 应用名：Pocket AI
- 包名：`com.fanshanng.aichatpocket`
- 版本：`1.0.0`
- 发布方式：GitHub Release 提供正式签名 APK
- APK 输出：`android/app/build/outputs/apk/release/app-release.apk`

## 功能

- 白色移动端聊天界面。
- 支持多个 API 配置，完成后自动保存并应用。
- API 配置支持一键测试连接。
- 支持 OpenAI Responses API。
- 支持 DeepSeek / Chat Completions 兼容接口。
- 支持实时流式回复和停止生成。
- 支持文本、图片、文件附件输入。
- 支持 Android 图片分享、多图分享、分屏拖入图片。
- 支持消息复制和长按复制，复制成功不弹提示。
- 密码、API Key、Token、URL、命令等内容会以等宽块显示。
- 内置内容插件系统；当前包含 LaTeX/密码学公式清理插件，可把 `cases`、`aligned`、`\oplus`、`\land`、`\Sigma_0` 等内容转成更易读的文本符号。
- 会话支持搜索、重命名、删除和复制 Markdown 导出。
- 设置里的语言切换实时生效，不需要额外保存。
- API 推理强度保留常用选项，也支持手动输入合法值。
- 常见 API 错误会显示更清楚的中文提示。
- 聊天记录、API 配置和附件保存在本机。

## 本地存储与隐私

- API Key：保存在系统 SecureStore / Android Keystore。
- 聊天记录和配置：加密后保存到本机 AsyncStorage。
- 附件：复制到应用私有文件目录。
- 网络请求：用户输入、附件和上下文会发送到用户自己配置的 API 服务商或网关。

卸载应用或清空本地数据会删除本机保存的聊天记录、配置和附件。

## 作者信息

设置页底部有轻量作者入口：

- GitHub：https://github.com/fanshanng
- 博客：https://fanshanng.cn/
- 邮箱：fanshanng@gmail.com

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

## 开发目录

日常开发目录：

```text
E:\android\projects\ai-chat-pocket
```

选择性 Git 上传目录：

```text
E:\android\projects\ai-chat-pocket-git
```

选择性目录只同步源码、配置、文档和必要资源，不同步 `node_modules`、构建产物、本地 SDK 路径、私钥、日志或用户数据。

## 常用命令

安装依赖：

```powershell
cd E:\android\projects\ai-chat-pocket
npm install
```

类型检查：

```powershell
cd E:\android\projects\ai-chat-pocket
cmd /c node_modules\.bin\tsc.cmd --noEmit
```

构建正式签名 APK：

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
cmd /c gradlew.bat assembleRelease
```

验证 APK 签名：

```powershell
E:\android\.devtools\android-sdk\build-tools\36.1.0\apksigner.bat verify --print-certs E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk
```

计算 APK SHA256：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk
```

## 发布签名

Release 构建会读取本机：

```text
android/keystore.properties
android/keystore/pocket-ai-release.keystore
```

这两个文件不进 Git，必须离线备份。首次公开发布后，后续同包名 APK 更新必须继续使用同一个签名密钥，否则 Android 无法覆盖升级。

当前正式签名证书 SHA-256：

```text
83e92deba5be48ebe1276107117ee9dee551b68971e75f5d3bee3404aa1e88b0
```

## 图标资源

源图保存在：

```text
assets/icon-source.png.jpg
```

派生资源包括：

```text
assets/icon.png
assets/splash-icon.png
assets/favicon.png
assets/android-icon-background.png
assets/android-icon-foreground.png
assets/android-icon-monochrome.png
android/app/src/main/res/mipmap-*/
android/app/src/main/res/drawable-*/splashscreen_logo.png
```

由于当前项目已有原生 Android 工程，更新图标时不仅要更新 `assets/`，也要同步更新 `android/app/src/main/res/` 里的启动器图标和启动页图标。

## 发布说明

本项目目前计划保持私有/闭源。GitHub Release 发布 APK 时建议同时附上：

- `app-release.apk`
- APK SHA256
- 签名证书 SHA-256
- 版本号和主要更新说明
- 简短免责声明：用户自备 API Key，AI 输出可能不准确，应用不是 OpenAI / DeepSeek 官方产品。
