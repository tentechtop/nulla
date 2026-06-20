param(
    [string]$DeviceId = "",
    [switch]$CleanInstall
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$androidDirectory = Join-Path $projectRoot "android"
$nodeModulesDirectory = Join-Path $projectRoot "node_modules"
$gradleWrapperPath = Join-Path $androidDirectory "gradlew.bat"
$apkPath = Join-Path $androidDirectory "app\build\outputs\apk\release\app-release.apk"
$androidPackageName = "com.nulla.dex"
$buildLogPath = Join-Path $projectRoot "build-android-release.log"
$buildStdoutPath = Join-Path $projectRoot "build-android-release.stdout.log"
$buildStderrPath = Join-Path $projectRoot "build-android-release.stderr.log"
$generateBrandAssetsScriptPath = Join-Path $PSScriptRoot "generate-brand-assets.ps1"
$syncAndroidIconsScriptPath = Join-Path $PSScriptRoot "sync-android-icons.ps1"
$syncAndroidSplashScriptPath = Join-Path $PSScriptRoot "sync-android-splash.ps1"

function Assert-CommandExists {
    param(
        [string]$CommandName
    )

    if (Get-Command $CommandName -ErrorAction SilentlyContinue) {
        return
    }

    throw "缺少命令：$CommandName，请先安装并加入 PATH。"
}

function Invoke-Step {
    param(
        [string]$Message,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Message"
    & $Action
}

function Get-ConnectedAndroidDeviceId {
    param(
        [string]$PreferredDeviceId
    )

    $deviceLines = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\tdevice$" }
    $deviceIds = @($deviceLines | ForEach-Object { ($_ -split "\s+")[0] })

    if ($PreferredDeviceId.Length -gt 0) {
        if ($deviceIds -contains $PreferredDeviceId) {
            return $PreferredDeviceId
        }

        throw "未找到指定设备：$PreferredDeviceId。当前在线设备：$($deviceIds -join ', ')"
    }

    if ($deviceIds.Count -eq 1) {
        return $deviceIds[0]
    }

    if ($deviceIds.Count -eq 0) {
        throw "未发现 Android 设备。请打开 USB 调试并确认授权。"
    }

    throw "检测到多台 Android 设备：$($deviceIds -join ', ')。请用 -DeviceId 指定目标设备。"
}

function Test-AndroidPackageInstalled {
    param(
        [string]$TargetDeviceId,
        [string]$PackageName
    )

    $packageLines = adb -s $TargetDeviceId shell pm list packages $PackageName
    return @($packageLines | Where-Object { $_ -eq "package:$PackageName" }).Count -gt 0
}

function Assert-AndroidPackageInstalled {
    param(
        [string]$TargetDeviceId,
        [string]$PackageName
    )

    if (Test-AndroidPackageInstalled $TargetDeviceId $PackageName) {
        return
    }

    throw "安装校验失败：手机上未发现包 $PackageName。"
}

function Invoke-CheckedAdb {
    param(
        [string]$FailureMessage,
        [string[]]$Arguments
    )

    $temporaryBasePath = Join-Path ([System.IO.Path]::GetTempPath()) "nulla-adb-$([System.Guid]::NewGuid().ToString('N'))"
    $stdoutPath = "$temporaryBasePath.out"
    $stderrPath = "$temporaryBasePath.err"
    $adbProcess = Start-Process `
        -FilePath "adb" `
        -ArgumentList $Arguments `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -WindowStyle Hidden `
        -Wait `
        -PassThru

    $stdoutLines = @()
    $stderrLines = @()

    if (Test-Path $stdoutPath) {
        $stdoutLines = @(Get-Content -LiteralPath $stdoutPath -Encoding UTF8)
    }

    if (Test-Path $stderrPath) {
        $stderrLines = @(Get-Content -LiteralPath $stderrPath -Encoding UTF8)
    }

    Remove-Item -LiteralPath $stdoutPath, $stderrPath -ErrorAction SilentlyContinue

    $commandOutput = @($stdoutLines + $stderrLines)
    $commandOutput

    if ($adbProcess.ExitCode -eq 0) {
        return $commandOutput
    }

    throw "$FailureMessage，adb 退出码：$($adbProcess.ExitCode)。输出：$($commandOutput -join ' ')"
}

Push-Location $projectRoot
try {
    # 功能目的：校验打包安装依赖；实现原因：提前失败比 Gradle 中途报错更容易定位
    Assert-CommandExists "adb"
    Assert-CommandExists "java"
    Assert-CommandExists "npx.cmd"

    $targetDeviceId = Get-ConnectedAndroidDeviceId $DeviceId
    Write-Host "目标设备：$targetDeviceId"

    # 功能目的：补齐 JS 依赖；实现原因：首次拉取项目时 node_modules 可能不存在
    if (!(Test-Path $nodeModulesDirectory)) {
        Invoke-Step "安装 npm 依赖" {
            npm install
        }
    }

    # 功能目的：刷新品牌图片资源；实现原因：打包前必须确保图标和启动图来自最新设计
    Invoke-Step "生成品牌资源" {
        & $generateBrandAssetsScriptPath | Out-Null
    }

    # 功能目的：按需生成 Android 原生工程；实现原因：已有工程由专用脚本同步品牌资源更稳定
    if (!(Test-Path $androidDirectory)) {
        Invoke-Step "生成 Android 工程" {
            npx.cmd expo prebuild --platform android
        }
    } else {
        Invoke-Step "复用 Android 原生工程" {
            Write-Host "android 目录已存在，跳过 expo prebuild。"
        }
    }

    # 功能目的：强制同步 Android 桌面图标；实现原因：Expo prebuild 在已有工程中可能不覆盖 mipmap 资源
    Invoke-Step "同步 Android 图标资源" {
        & $syncAndroidIconsScriptPath | Out-Null
    }

    # 功能目的：强制同步 Android 原生启动图；实现原因：JS 动画加载前需要干净品牌兜底画面
    Invoke-Step "同步 Android 启动图资源" {
        & $syncAndroidSplashScriptPath | Out-Null
    }

    if (!(Test-Path $gradleWrapperPath)) {
        throw "未找到 Gradle Wrapper：$gradleWrapperPath"
    }

    # 功能目的：构建 Release APK；实现原因：Release 包会内置 JS Bundle，手机无需依赖 Metro
    Invoke-Step "构建 Android Release APK" {
        Remove-Item -LiteralPath $buildLogPath, $buildStdoutPath, $buildStderrPath -ErrorAction SilentlyContinue
        $gradleProcess = Start-Process `
            -FilePath $gradleWrapperPath `
            -ArgumentList @("assembleRelease", "--console=plain") `
            -WorkingDirectory $androidDirectory `
            -RedirectStandardOutput $buildStdoutPath `
            -RedirectStandardError $buildStderrPath `
            -WindowStyle Hidden `
            -Wait `
            -PassThru

        if (Test-Path $buildStdoutPath) {
            Get-Content -Encoding UTF8 $buildStdoutPath | Tee-Object -FilePath $buildLogPath
        }

        if (Test-Path $buildStderrPath) {
            Get-Content -Encoding UTF8 $buildStderrPath | Tee-Object -FilePath $buildLogPath -Append
        }

        if ($gradleProcess.ExitCode -ne 0) {
            throw "Gradle 构建失败，日志：$buildLogPath"
        }
    }

    if (!(Test-Path $apkPath)) {
        throw "APK 未生成：$apkPath"
    }

    if ($CleanInstall) {
        Invoke-Step "跳过卸载旧版 SOL" {
            # 功能目的：兼容旧 CleanInstall 命令；实现原因：覆盖安装可避免手机端卸载确认
            Write-Host "CleanInstall 已不再卸载旧包，将继续使用 adb install -r 覆盖安装。"
        }
    }

    # 功能目的：安装到指定手机；实现原因：明确设备 ID 避免多设备环境装错目标
    Invoke-Step "安装 APK 到手机" {
        Invoke-CheckedAdb "安装 APK 失败，请检查手机 USB 安装授权" @("-s", $targetDeviceId, "install", "-r", $apkPath) | Out-Null
        Assert-AndroidPackageInstalled $targetDeviceId $androidPackageName
    }

    # 功能目的：自动启动应用；实现原因：安装后直接查看 SOL 首页效果
    Invoke-Step "启动 SOL" {
        $launchOutput = Invoke-CheckedAdb "启动 SOL 失败" @("-s", $targetDeviceId, "shell", "monkey", "-p", $androidPackageName, "-c", "android.intent.category.LAUNCHER", "1")
        if (($launchOutput -join "`n") -match "No activities found|aborted") {
            throw "启动 SOL 失败：未找到可启动 Activity。"
        }
    }

    Write-Host ""
    Write-Host "完成：APK 已安装并启动。"
    Write-Host "APK 路径：$apkPath"
    Write-Host "构建日志：$buildLogPath"
} finally {
    Pop-Location
}
