# Pocket AI Release Checklist

面向 GitHub Release 的首版/后续版本发布清单。

## 版本信息

- 检查 `package.json` 版本。
- 检查 `app.json` 版本。
- 检查 `android/app/build.gradle` 的 `versionCode` 和 `versionName`。
- 后续每次发布都要递增 `versionCode`。

## 闭源发布模式

- GitHub 仓库后续仅发布 Release，不再同步后续开发源码。
- `E:\android\projects\ai-chat-pocket-git` 仍作为本地上传工作区，但默认只用于整理发布资料和核对版本一致性。
- 只有在你明确决定更新公开仓库内容时，才允许 push 新的源码快照。
- 如果准备恢复私有源码同步，先确认 GitHub 仓库已经切成私有，且当前机器的 SSH / Token 权限可正常访问远端后再 push。
- 日常版本迭代仍在原项目目录完成；对外发布时，默认流程是更新 GitHub Release 页面、上传 APK、填写 release note。
- 本地 `release-notes/`、`PROJECT_HANDOFF.md`、架构计划、签名备份等仍然保留，用于私有开发和回溯，不要求全部公开。

## 发布前验证

## Codex 辅助检查

- 涉及 API Key、聊天导出、附件缓存、签名文件、上传目录、Release 边界时，先让 Codex 使用 `security-best-practices` 做只读审查。
- 涉及拆分 `App.tsx`、长期架构计划、provider capabilities、上下文管理时，先让 Codex 使用 `define-goal` 拆成小目标。
- 接入 GitHub Actions 或排查 CI 失败时，让 Codex 使用 `gh-fix-ci`。
- 这些 skill 只作为流程辅助，不替代版本号递增、真机测试、APK SHA256、选择性同步和手动发布规则。

## 自动检查

```powershell
cd E:\android\projects\ai-chat-pocket
cmd /c node_modules\.bin\tsc.cmd --noEmit
```

```powershell
cd E:\android\projects\ai-chat-pocket\android
$env:JAVA_HOME='D:\JAVA\jdk-21.0.2.13-hotspot'
$env:NODE_ENV='production'
cmd /c gradlew.bat assembleRelease
```

必要时强制刷新资源：

```powershell
cmd /c gradlew.bat assembleRelease --rerun-tasks
```

## 签名检查

```powershell
E:\android\.devtools\android-sdk\build-tools\36.1.0\apksigner.bat verify --print-certs E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk
```

期望签名证书 SHA-256：

```text
9818729430986a531f0ac5e68b526dc019bc68a8320273306b6635436e939db1
```

## APK 哈希

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath E:\android\projects\ai-chat-pocket\android\app\build\outputs\apk\release\app-release.apk
```

把输出写进 GitHub Release 说明。

## 真机冒烟测试

- 全新安装 APK。
- 打开应用无闪退。
- 新建会话。
- 新增/编辑 API 配置。
- 测试 API 连接。
- 发送文本消息。
- 测试流式回复。
- 测试停止生成。
- 测试图片附件。
- 测试文件附件。
- 测试 Android 分享图片到应用。
- 测试复制消息。
- 测试会话搜索、重命名、删除。
- 测试设置页上下滑动。
- 测试清空本地数据。

## GitHub Release 内容

建议标题：

```text
Pocket AI vX.Y.Z
```

建议先在仓库内写一份发布页草稿：

```text
release-notes/github-release-vX.Y.Z.md
```

建议附件：

```text
android/app/build/outputs/apk/release/app-release.apk
```

建议说明包含：

- 主要功能。
- 安装方式。
- APK SHA256。
- 签名证书 SHA-256。
- 用户需要自备 API Key。
- AI 输出可能不准确。
- 本应用不是 OpenAI / DeepSeek 官方产品。
- 如果仓库已切换为闭源发布模式，可直接说明“后续版本仅通过 GitHub Releases 分发 APK，不再公开同步源码更新”。

## 严禁上传

- `node_modules/`
- `android/app/build/`
- `android/build/`
- `android/.gradle/`
- `android/local.properties`
- `android/keystore.properties`
- `android/keystore/`
- `LOCAL_PRIVATE/`
- `.env*`
- 调试日志、截图、本地用户数据

## 备份

必须离线备份：

```text
E:\android\projects\ai-chat-pocket\android\keystore.properties
E:\android\projects\ai-chat-pocket\LOCAL_PRIVATE\signing\
```

丢失后无法给同包名 APK 做覆盖升级。
