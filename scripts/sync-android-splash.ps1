$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resourceDirectory = Join-Path $projectRoot "android\app\src\main\res"
$splashLogoSourcePath = Join-Path $projectRoot "assets\brand\splash-logo.png"
$colorsPath = Join-Path $resourceDirectory "values\colors.xml"
$stringsPath = Join-Path $resourceDirectory "values\strings.xml"
$splashDrawablePath = Join-Path $resourceDirectory "drawable\splashscreen.xml"

function Assert-FileExists {
    param([string]$FilePath)

    if (Test-Path -LiteralPath $FilePath) {
        return
    }

    throw "缺少文件：$FilePath"
}

function Set-XmlTextNode {
    param(
        [xml]$Document,
        [string]$NodeName,
        [string]$AttributeName,
        [string]$AttributeValue,
        [string]$TextValue
    )

    $targetNode = $Document.resources.$NodeName | Where-Object { $_.$AttributeName -eq $AttributeValue } | Select-Object -First 1
    if ($null -eq $targetNode) {
        $targetNode = $Document.CreateElement($NodeName)
        $nameAttribute = $Document.CreateAttribute($AttributeName)
        $nameAttribute.Value = $AttributeValue
        [void]$targetNode.Attributes.Append($nameAttribute)
        [void]$Document.resources.AppendChild($targetNode)
    }

    $targetNode.InnerText = $TextValue
}

function Save-XmlDocument {
    param(
        [xml]$Document,
        [string]$TargetPath
    )

    $xmlWriterSettings = New-Object System.Xml.XmlWriterSettings
    $xmlWriterSettings.Encoding = [System.Text.UTF8Encoding]::new($false)
    $xmlWriterSettings.Indent = $true

    $xmlWriter = [System.Xml.XmlWriter]::Create($TargetPath, $xmlWriterSettings)
    try {
        $Document.Save($xmlWriter)
    } finally {
        $xmlWriter.Dispose()
    }
}

function Save-ScaledSplashLogo {
    param(
        [string]$TargetPath,
        [double]$Scale
    )

    # 功能目的：生成 Android 密度启动 logo；实现原因：系统启动页只能读取 drawable 位图资源
    $canvasWidth = [int][Math]::Round(360 * $Scale)
    $canvasHeight = [int][Math]::Round(120 * $Scale)
    $sourceImage = [System.Drawing.Image]::FromFile($splashLogoSourcePath)
    $targetBitmap = New-Object -TypeName System.Drawing.Bitmap -ArgumentList @($canvasWidth, $canvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($targetBitmap)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $maxLogoWidth = 280 * $Scale
    $maxLogoHeight = 44 * $Scale
    $scaleRatio = [Math]::Min($maxLogoWidth / $sourceImage.Width, $maxLogoHeight / $sourceImage.Height)
    $drawWidth = [Math]::Round($sourceImage.Width * $scaleRatio)
    $drawHeight = [Math]::Round($sourceImage.Height * $scaleRatio)
    $drawLeft = [Math]::Round(($canvasWidth - $drawWidth) / 2)
    $drawTop = [Math]::Round(($canvasHeight - $drawHeight) / 2)

    $graphics.DrawImage($sourceImage, $drawLeft, $drawTop, $drawWidth, $drawHeight)
    $targetBitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $targetBitmap.Dispose()
    $sourceImage.Dispose()
}

Assert-FileExists $resourceDirectory
Assert-FileExists $splashLogoSourcePath
Assert-FileExists $colorsPath
Assert-FileExists $stringsPath
Assert-FileExists $splashDrawablePath

$densityScales = @{
    "drawable-mdpi" = 1
    "drawable-hdpi" = 1.5
    "drawable-xhdpi" = 2
    "drawable-xxhdpi" = 3
    "drawable-xxxhdpi" = 4
}

foreach ($densityName in $densityScales.Keys) {
    $densityDirectory = Join-Path $resourceDirectory $densityName
    Assert-FileExists $densityDirectory
    Save-ScaledSplashLogo (Join-Path $densityDirectory "splashscreen_image.png") $densityScales[$densityName]
}

[xml]$colorsXml = Get-Content -LiteralPath $colorsPath -Encoding UTF8
Set-XmlTextNode $colorsXml "color" "name" "splashscreen_background" "#FFFFFF"
Save-XmlDocument $colorsXml $colorsPath

[xml]$stringsXml = Get-Content -LiteralPath $stringsPath -Encoding UTF8
Set-XmlTextNode $stringsXml "string" "name" "expo_splash_screen_resize_mode" "contain"
Save-XmlDocument $stringsXml $stringsPath

$splashXml = @'
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/splashscreen_background" />
  <item>
    <bitmap
      android:gravity="center"
      android:src="@drawable/splashscreen_image" />
  </item>
</layer-list>
'@

[System.IO.File]::WriteAllText($splashDrawablePath, $splashXml, [System.Text.UTF8Encoding]::new($false))

Get-ChildItem -LiteralPath $resourceDirectory -Recurse -File -Filter "splashscreen*" |
    Select-Object FullName, Length, LastWriteTime
