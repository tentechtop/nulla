$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resourceDirectory = Join-Path $projectRoot "android\app\src\main\res"
$colorsPath = Join-Path $resourceDirectory "values\colors.xml"
$stringsPath = Join-Path $resourceDirectory "values\strings.xml"
$splashDrawablePath = Join-Path $resourceDirectory "drawable\splashscreen.xml"

function Assert-FileExists {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
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
    if ($null -ne $targetNode) {
        $targetNode.InnerText = $TextValue
        return
    }

    $targetNode = $Document.CreateElement($NodeName)
    $nameAttribute = $Document.CreateAttribute($AttributeName)
    $nameAttribute.Value = $AttributeValue
    [void]$targetNode.Attributes.Append($nameAttribute)
    $targetNode.InnerText = $TextValue
    [void]$Document.resources.AppendChild($targetNode)
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

function New-Brush {
    param([string]$Hex)

    return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function New-ScaledPoint {
    param(
        [System.Drawing.RectangleF]$Bounds,
        [float]$X,
        [float]$Y
    )

    return [System.Drawing.PointF]::new(
        $Bounds.X + ($Bounds.Width * $X),
        $Bounds.Y + ($Bounds.Height * $Y)
    )
}

function Draw-LogoPiece {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.RectangleF]$Bounds,
        [float[][]]$Points,
        [System.Drawing.Brush]$Brush
    )

    $scaledPoints = @()
    foreach ($point in $Points) {
        $scaledPoints += New-ScaledPoint $Bounds $point[0] $point[1]
    }

    $Graphics.FillPolygon($Brush, [System.Drawing.PointF[]]$scaledPoints)
}

function Draw-SplashGlyph {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.RectangleF]$Bounds
    )

    # 功能目的：输出纯黑启动 LOGO；实现原因：原生启动页背景由 layer-list 统一提供白色
    $logoBrush = New-Brush "#050505"
    $transparentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Transparent)
    $pieces = @(
        @(
            @(0.164, 0.178), @(0.330, 0.178), @(0.483, 0.325), @(0.483, 0.348),
            @(0.338, 0.348), @(0.338, 0.494), @(0.314, 0.494), @(0.164, 0.348)
        ),
        @(
            @(0.836, 0.178), @(0.670, 0.178), @(0.517, 0.325), @(0.517, 0.348),
            @(0.662, 0.348), @(0.662, 0.494), @(0.686, 0.494), @(0.836, 0.348)
        ),
        @(
            @(0.164, 0.822), @(0.330, 0.822), @(0.483, 0.675), @(0.483, 0.652),
            @(0.338, 0.652), @(0.338, 0.506), @(0.314, 0.506), @(0.164, 0.652)
        ),
        @(
            @(0.836, 0.822), @(0.670, 0.822), @(0.517, 0.675), @(0.517, 0.652),
            @(0.662, 0.652), @(0.662, 0.506), @(0.686, 0.506), @(0.836, 0.652)
        )
    )

    $previousCompositingMode = $Graphics.CompositingMode
    $Graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    foreach ($piece in $pieces) {
        Draw-LogoPiece -Graphics $Graphics -Bounds $Bounds -Points $piece -Brush $logoBrush
    }

    $cutout = [System.Drawing.RectangleF]::new(
        $Bounds.X + ($Bounds.Width * 0.338),
        $Bounds.Y + ($Bounds.Height * 0.348),
        $Bounds.Width * 0.324,
        $Bounds.Height * 0.304
    )
    $Graphics.FillRectangle($transparentBrush, $cutout)
    $Graphics.CompositingMode = $previousCompositingMode

    $transparentBrush.Dispose()
    $logoBrush.Dispose()
}

function Save-SplashImage {
    param(
        [string]$TargetPath,
        [int]$Scale
    )

    # 功能目的：生成 Android 密度启动符号；实现原因：避免白底 bitmap 与系统启动层叠出残影
    $canvasWidth = 240 * $Scale
    $canvasHeight = 240 * $Scale
    $logoSize = 110 * $Scale
    $bitmap = New-Object -TypeName System.Drawing.Bitmap -ArgumentList @($canvasWidth, $canvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $bounds = [System.Drawing.RectangleF]::new(
        ($canvasWidth - $logoSize) / 2,
        ($canvasHeight - $logoSize) / 2,
        $logoSize,
        $logoSize
    )
    Draw-SplashGlyph -Graphics $graphics -Bounds $bounds
    $bitmap.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
}

Assert-FileExists $resourceDirectory
Assert-FileExists $colorsPath
Assert-FileExists $stringsPath
Assert-FileExists $splashDrawablePath

$densityScales = @{
    "drawable-mdpi" = 1
    "drawable-hdpi" = 2
    "drawable-xhdpi" = 3
    "drawable-xxhdpi" = 4
    "drawable-xxxhdpi" = 5
}

foreach ($densityName in $densityScales.Keys) {
    $densityDirectory = Join-Path $resourceDirectory $densityName
    Assert-FileExists $densityDirectory
    Save-SplashImage (Join-Path $densityDirectory "splashscreen_image.png") $densityScales[$densityName]
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
