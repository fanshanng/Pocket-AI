# Pocket AI Release Checklist

面向 GitHub Release 的首版/后续版本发布清单。

## 版本信息

- 检查 `package.json` 版本。
- 检查 `app.json` 版本。
- 检查 `android/app/build.gradle` 的 `versionCode` 和 `versionName`。
- 后续每次发布都要递增 `versionCode`。

## 发布前验证

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
Pocket AI v1.2.0
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
