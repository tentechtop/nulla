$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resourceDirectory = Join-Path $projectRoot "android\app\src\main\res"
$iconSourcePath = Join-Path $projectRoot "assets\brand\icon.png"
$foregroundSourcePath = Join-Path $projectRoot "assets\brand\adaptive-icon.png"
$colorsPath = Join-Path $resourceDirectory "values\colors.xml"

function Assert-FileExists {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
        return
    }

    throw "缺少文件：$FilePath"
}

function Save-ScaledPng {
    param(
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$Size
    )

    # 功能目的：输出 Android 密度图标；实现原因：系统桌面读取 mipmap 而不是直接读取 Expo 源图
    $sourceImage = [System.Drawing.Image]::FromFile($SourcePath)
    $targetBitmap = New-Object System.Drawing.Bitmap $Size, $Size
    $graphics = [System.Drawing.Graphics]::FromImage($targetBitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImage, 0, 0, $Size, $Size)

    $targetBitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $targetBitmap.Dispose()
    $sourceImage.Dispose()
}

function Set-AndroidIconBackgroundColor {
    param([string]$ColorValue)

    # 功能目的：同步 adaptive icon 背景色；实现原因：前景图透明区域需要显示白色底色
    Assert-FileExists $colorsPath
    [xml]$colorsXml = Get-Content -LiteralPath $colorsPath -Encoding UTF8
    $iconBackgroundNode = $colorsXml.resources.color | Where-Object { $_.name -eq "iconBackground" } | Select-Object -First 1

    if ($null -eq $iconBackgroundNode) {
        $iconBackgroundNode = $colorsXml.CreateElement("color")
        $nameAttribute = $colorsXml.CreateAttribute("name")
        $nameAttribute.Value = "iconBackground"
        [void]$iconBackgroundNode.Attributes.Append($nameAttribute)
        [void]$colorsXml.resources.AppendChild($iconBackgroundNode)
    }

    $iconBackgroundNode.InnerText = $ColorValue

    $xmlWriterSettings = New-Object System.Xml.XmlWriterSettings
    $xmlWriterSettings.Encoding = [System.Text.UTF8Encoding]::new($false)
    $xmlWriterSettings.Indent = $true

    $xmlWriter = [System.Xml.XmlWriter]::Create($colorsPath, $xmlWriterSettings)
    try {
        $colorsXml.Save($xmlWriter)
    } finally {
        $xmlWriter.Dispose()
    }
}

Assert-FileExists $iconSourcePath
Assert-FileExists $foregroundSourcePath
Assert-FileExists $resourceDirectory

$densitySizes = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($densityName in $densitySizes.Keys) {
    $densityDirectory = Join-Path $resourceDirectory $densityName
    Assert-FileExists $densityDirectory

    $targetSize = $densitySizes[$densityName]
    Save-ScaledPng $iconSourcePath (Join-Path $densityDirectory "ic_launcher.png") $targetSize
    Save-ScaledPng $iconSourcePath (Join-Path $densityDirectory "ic_launcher_round.png") $targetSize
    Save-ScaledPng $foregroundSourcePath (Join-Path $densityDirectory "ic_launcher_foreground.png") $targetSize
}

Set-AndroidIconBackgroundColor "#FFFFFF"

Get-ChildItem -LiteralPath $resourceDirectory -Recurse -File -Filter "ic_launcher*.png" |
    Select-Object FullName, Length, LastWriteTime
