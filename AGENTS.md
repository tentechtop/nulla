# AGENTS.md instructions for `F:\workSpace2029\nulla`

## 固定规则

- 运行环境：Windows PowerShell。
- 搜索文件优先使用 PowerShell 原生命令，不使用 `rg` / `ripgrep`。
- 全链路 UTF-8 编码。
- 不修改 `openapi.yml`。

## 打包安装到 Android 手机

当用户说“帮我打包安装”“打包安装到手机”“安装到我的手机”时，直接执行：

```powershell
npm run android:install
```

脚本位置：

```powershell
scripts\build-install-android.ps1
```

脚本行为：

- 自动检测已连接且授权的 Android 设备。
- 首次缺少 `node_modules` 时执行 `npm install`。
- 仅在缺少 `android` 目录时执行 `npx.cmd expo prebuild --platform android`。
- 已有 Android 工程时跳过 prebuild，并由专用脚本同步 App 图标和启动图。
- 执行 `android\gradlew.bat assembleRelease` 生成内置 JS Bundle 的 Release APK。
- 写入构建日志 `build-android-release.log`。
- 执行 `adb install -r` 安装到手机。
- 安装完成后自动启动包名 `com.nulla.dex`。

多设备时指定设备：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-install-android.ps1 -DeviceId 设备ID
```

兼容旧自动化命令且不卸载旧包时执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-install-android.ps1 -CleanInstall
```

该参数只保留兼容性，脚本仍使用 `adb install -r` 覆盖安装，避免手机端卸载确认影响自动化。
