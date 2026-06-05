# Pocket AI

Pocket AI 是一个基于 Expo / React Native / TypeScript 开发的本地优先移动端 AI 聊天应用。

应用直接在手机端请求 OpenAI 兼容接口，支持文本、图片、文件输入，并把聊天记录保存在本机。

## 当前功能

- 白色移动端聊天界面，风格参考 ChatGPT / Gemini 等现代 AI 应用。
- 支持多个本地 API 配置。
- API 配置页点击“完成”会自动保存，并把当前编辑的配置应用为聊天后端。
- 每个 API 配置单独保存 API Key，密钥存储在 `expo-secure-store`。
- 支持 OpenAI Responses API 请求流程。
- 支持 DeepSeek / Chat Completions 兼容请求流程。
- 支持助手回复实时流式输出。
- 支持发送过程中停止生成。
- 支持文本、图片、文件附件输入。
- 支持 Android 系统分享图片、多图分享、分屏拖入图片；收到的图片会进入待发送附件队列。
- 消息提供简洁的复制按钮，复制成功后图标变为小对号，不弹出提示。
- 长按消息文本可复制。
- 密码、API Key、Token、命令、路径、URL 等内容会使用等宽横向块显示，便于阅读和复制。
- 助手回复中如果包含可下载的图片/文档链接，应用会尝试保存为附件。
- 聊天记录、会话、配置元数据加密保存在本机。
- 支持本地会话管理。
- 根据模型名显示 `Codex` / `CLI` 等助手标签。
- 支持中文和英文界面文案。

## 本地存储

应用会在本机保存以下内容：

- API Key：系统 SecureStore / Android Keystore。
- 聊天记录、会话列表、API 配置元数据、界面状态：加密后的 `AsyncStorage`，键名为 `ai-chat-pocket.state.v1`。
- 状态加密密钥：系统 SecureStore / Android Keystore，键名为 `ai-chat-pocket.state-encryption-key.v1`。
- 导入的附件：通过 Expo FileSystem 复制到应用私有文件目录。

卸载应用或在设置中执行“清空本地数据”会删除这些本地内容。

## 安全说明

本项目定位为个人使用的本地优先客户端。API Key 保存在用户自己的设备上。

如果未来要公开分发给不可信用户，不建议继续让客户端直接持有服务商 API Key，应增加后端代理、用户级鉴权、额度控制或其他密钥保护方案。

## 项目结构

```text
App.tsx                            主应用 UI、状态和弹窗逻辑
index.ts                           Expo 入口
app.json                           Expo 应用配置
assets/                            应用图标和启动图资源
src/components/MessageBubble.tsx   聊天气泡、Markdown、复制按钮和长按复制
src/lib/files.ts                   图片/文件选择、共享图片接收、附件持久化和清理
src/lib/ids.ts                     ID 生成工具
src/lib/models.ts                  默认 API 配置、模型识别和提示文案
src/lib/openai.ts                  OpenAI Responses 与 Chat Completions 请求构造/解析
src/lib/storage.ts                 本地加密状态和 API Key 存储
src/types.ts                       共享 TypeScript 类型
android/                           Android 原生工程，用于构建 APK
android/app/src/main/java/.../SharedImageModule.kt
                                   Android 图片分享/拖入 URI 桥接模块
```

## API 配置

设置页支持多个 API 配置。每个配置包含：

- 接口类型：`OpenAI Responses` 或 `Chat Completions compatible`。
- Base URL：只填写 API 根地址，不填写最终接口路径。
- 模型名。
- API Key：单独存储在 SecureStore。
- 可选系统提示词。
- 可选 Project ID / Organization。

DeepSeek 示例：

```text
接口类型：Chat Completions compatible
Base URL：https://api.deepseek.com
模型：deepseek-v4-flash
Project ID：留空
Organization：留空
系统提示词：你是一个简洁的中文助手。回答先给结论，再给例子。
```

OpenAI Responses 示例：

```text
接口类型：OpenAI Responses
Base URL：https://api.openai.com/v1
模型：gpt-5.4
Project ID：可选，例如 proj_xxx
Organization：可选，例如 org_xxx
系统提示词：你是一个严谨的编程助手，优先给出可验证、可执行的建议。
```

`Project ID` 和 `Organization` 主要是 OpenAI 的账号/项目路由字段，DeepSeek 一般不需要填写。系统提示词会作为长期规则随上下文发送。

## 开发与构建

安装依赖：

```powershell
cd E:\android\projects\ai-chat-pocket
npm install
```

类型检查：

```powershell
cmd /c node_modules\.bin\tsc.cmd --noEmit
```

构建独立 Android Release APK：

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
cmd /c gradlew.bat assembleRelease
```

APK 输出位置：

```text
android/app/build/outputs/apk/release/app-release.apk
```

安装到已连接的 Android 设备：

```powershell
adb install -r .\android\app\build\outputs\apk\release\app-release.apk
```

本项目可以按独立 APK 方式测试。正常安装使用不需要 Metro 服务，也不要求手机和电脑处于同一局域网。

## 后续优化方向

推荐优先级：

1. API 配置测试按钮  
   在 API 配置弹窗中增加“测试连接”，检查 API Key、Base URL、接口类型和模型是否可用。

2. 拆分 `App.tsx`  
   将聊天页面、输入框、设置弹窗、API 配置弹窗、会话弹窗、状态 hooks 拆成更小模块。

3. 更完整的生成文件能力  
   增加服务商级图片生成、PDF/DOCX 导出等能力。目前只支持识别并下载助手回复中的图片/文档链接。

4. 会话管理增强  
   增加重命名、搜索、置顶、批量删除、完整会话导出等功能。

5. 上下文窗口控制  
   避免无限制发送全部历史，支持最近消息窗口、旧消息摘要和按服务商限制裁剪。

6. 服务商能力标记  
   为不同 API 配置标记是否支持 Responses 链式上下文、图片、文件、系统消息、推理参数等。

7. 更友好的 API 错误  
   将 401、404、429、超时、响应格式不兼容等错误转成清晰的中文/英文提示。

8. 安全增强  
   增加应用锁、生物识别、加密备份/恢复，以及正式发布前的 release 签名密钥。

## GitHub 上传说明

本项目计划保持私有/闭源。

日常开发目录：

```text
E:\android\projects\ai-chat-pocket
```

选择性 Git/GitHub 上传目录：

```text
E:\android\projects\ai-chat-pocket-git
```

`ai-chat-pocket-git` 只保留私有仓库所需的源码、配置、文档和资源，不应包含：

- `node_modules`
- 构建产物
- 本地 SDK 路径
- `local.properties`
- debug/release 私钥
- 本地设备日志
- 应用私有运行状态或用户数据
