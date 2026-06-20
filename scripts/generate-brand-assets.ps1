$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetDirectory = Join-Path $projectRoot "assets\brand"

New-Item -ItemType Directory -Force $assetDirectory | Out-Null

function New-BrandBrush {
    param([string]$Hex)

    return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function New-RoundedRectanglePath {
    param(
        [float]$Left,
        [float]$Top,
        [float]$BoxWidth,
        [float]$BoxHeight,
        [float]$Radius
    )

    $maximumRadius = [Math]::Min($BoxWidth, $BoxHeight) / 2
    $safeRadius = [Math]::Min($Radius, $maximumRadius)
    $diameter = [single]($safeRadius * 2)
    Write-Host "RoundArgs left=$Left top=$Top width=$BoxWidth height=$BoxHeight radius=$Radius diameter=$diameter"
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($Left, $Top, $diameter, $diameter, 180, 90)
    $path.AddArc($Left + $BoxWidth - $diameter, $Top, $diameter, $diameter, 270, 90)
    $path.AddArc($Left + $BoxWidth - $diameter, $Top + $BoxHeight - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Left, $Top + $BoxHeight - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-LogoPoint {
    param(
        [System.Drawing.RectangleF]$Panel,
        [float]$X,
        [float]$Y
    )

    return [System.Drawing.PointF]::new(
        $Panel.X + ($Panel.Width * $X),
        $Panel.Y + ($Panel.Height * $Y)
    )
}

function Draw-LogoPiece {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.RectangleF]$Panel,
        [array]$Points,
        [System.Drawing.Brush]$Brush
    )

    $scaledPoints = @()
    foreach ($point in $Points) {
        $scaledPoints += New-LogoPoint -Panel $Panel -X $point[0] -Y $point[1]
    }

    $Graphics.FillPolygon($Brush, [System.Drawing.PointF[]]$scaledPoints)
}

function Draw-ReferenceIcon {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$IconCanvasSize
    )

    # 功能目的：一比一绘制参考应用图标；实现原因：所有平台资源必须同源避免视觉偏差
    $panelSize = [float]($IconCanvasSize * 0.742)
    $panel = [System.Drawing.RectangleF]::new(
        $CenterX - ($panelSize / 2),
        $CenterY - ($panelSize / 2),
        $panelSize,
        $panelSize
    )

    $panelX = [float]$panel.X
    $panelY = [float]$panel.Y
    $panelWidth = [float]$panel.Width
    $panelHeight = [float]$panel.Height
    $panelRadius = [float]($panelSize * 0.188)
    $panelPath = New-RoundedRectanglePath -Left $panelX -Top $panelY -BoxWidth $panelWidth -BoxHeight $panelHeight -Radius $panelRadius
    $panelBrush = New-BrandBrush "#020304"
    $Graphics.FillPath($panelBrush, $panelPath)

    $logoBrush = New-BrandBrush "#FFFFFF"
    $pieces = @(
        @(@(0.164, 0.178), @(0.330, 0.178), @(0.483, 0.325), @(0.483, 0.348), @(0.338, 0.348), @(0.338, 0.494), @(0.314, 0.494), @(0.164, 0.348)),
        @(@(0.836, 0.178), @(0.670, 0.178), @(0.517, 0.325), @(0.517, 0.348), @(0.662, 0.348), @(0.662, 0.494), @(0.686, 0.494), @(0.836, 0.348)),
        @(@(0.164, 0.822), @(0.330, 0.822), @(0.483, 0.675), @(0.483, 0.652), @(0.338, 0.652), @(0.338, 0.506), @(0.314, 0.506), @(0.164, 0.652)),
        @(@(0.836, 0.822), @(0.670, 0.822), @(0.517, 0.675), @(0.517, 0.652), @(0.662, 0.652), @(0.662, 0.506), @(0.686, 0.506), @(0.836, 0.652))
    )

    foreach ($piece in $pieces) {
        Draw-LogoPiece -Graphics $Graphics -Panel $panel -Points $piece -Brush $logoBrush
    }

    $cutoutBrush = New-BrandBrush "#020304"
    $cutout = [System.Drawing.RectangleF]::new(
        $panel.X + ($panel.Width * 0.338),
        $panel.Y + ($panel.Height * 0.348),
        $panel.Width * 0.324,
        $panel.Height * 0.304
    )
    $Graphics.FillRectangle($cutoutBrush, $cutout)

    $cutoutBrush.Dispose()
    $logoBrush.Dispose()
    $panelBrush.Dispose()
    $panelPath.Dispose()
}

function Draw-ReferenceGlyph {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$CenterX,
        [float]$CenterY,
        [float]$GlyphSize,
        [System.Drawing.Brush]$CutoutBrush
    )

    # 功能目的：绘制启动页纯 LOGO；实现原因：启动页不能包含 App 图标黑色底板
    $glyphBounds = [System.Drawing.RectangleF]::new(
        $CenterX - ($GlyphSize / 2),
        $CenterY - ($GlyphSize / 2),
        $GlyphSize,
        $GlyphSize
    )
    $logoBrush = New-BrandBrush "#050505"
    $pieces = @(
        @(@(0.164, 0.178), @(0.330, 0.178), @(0.483, 0.325), @(0.483, 0.348), @(0.338, 0.348), @(0.338, 0.494), @(0.314, 0.494), @(0.164, 0.348)),
        @(@(0.836, 0.178), @(0.670, 0.178), @(0.517, 0.325), @(0.517, 0.348), @(0.662, 0.348), @(0.662, 0.494), @(0.686, 0.494), @(0.836, 0.348)),
        @(@(0.164, 0.822), @(0.330, 0.822), @(0.483, 0.675), @(0.483, 0.652), @(0.338, 0.652), @(0.338, 0.506), @(0.314, 0.506), @(0.164, 0.652)),
        @(@(0.836, 0.822), @(0.670, 0.822), @(0.517, 0.675), @(0.517, 0.652), @(0.662, 0.652), @(0.662, 0.506), @(0.686, 0.506), @(0.836, 0.652))
    )

    foreach ($piece in $pieces) {
        Draw-LogoPiece -Graphics $Graphics -Panel $glyphBounds -Points $piece -Brush $logoBrush
    }

    $cutout = [System.Drawing.RectangleF]::new(
        $glyphBounds.X + ($glyphBounds.Width * 0.338),
        $glyphBounds.Y + ($glyphBounds.Height * 0.348),
        $glyphBounds.Width * 0.324,
        $glyphBounds.Height * 0.304
    )
    $Graphics.FillRectangle($CutoutBrush, $cutout)
    $logoBrush.Dispose()
}

function New-Canvas {
    param(
        [int]$CanvasWidth,
        [int]$CanvasHeight,
        [System.Drawing.Color]$BackgroundColor = [System.Drawing.Color]::White
    )

    # 功能目的：创建高质量位图画布；实现原因：缩放到 Android 密度资源时边缘必须清晰
    Write-Host "CanvasArgs width=$CanvasWidth widthType=$($CanvasWidth.GetType().FullName) height=$CanvasHeight heightType=$($CanvasHeight.GetType().FullName)"
    $bitmap = New-Object -TypeName System.Drawing.Bitmap -ArgumentList @($CanvasWidth, $CanvasHeight)
    if ($null -ne $bitmap) {
        Write-Host "BitmapType=$($bitmap.GetType().FullName)"
    }

    if ($null -eq $bitmap) {
        throw "Bitmap create failed: [$CanvasWidth] x [$CanvasHeight]"
    }

    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear($BackgroundColor)

    return @{
        Bitmap = $bitmap
        Graphics = $graphics
    }
}

function Save-Icon {
    param([string]$TargetPath)

    # 功能目的：生成应用入口图标；实现原因：Expo、Web 和 Android 标准图标共用该源文件
    $canvas = New-Canvas -CanvasWidth 1024 -CanvasHeight 1024 -BackgroundColor ([System.Drawing.Color]::Transparent)
    Draw-ReferenceIcon -Graphics $canvas["Graphics"] -CenterX 512 -CenterY 512 -IconCanvasSize 1024
    $canvas["Bitmap"].Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas["Graphics"].Dispose()
    $canvas["Bitmap"].Dispose()
}

function Save-SplashLogo {
    param([string]$TargetPath)

    # 功能目的：生成透明底启动 LOGO；实现原因：白底由页面提供避免层叠残影
    $canvas = New-Canvas -CanvasWidth 720 -CanvasHeight 720 -BackgroundColor ([System.Drawing.Color]::Transparent)
    $transparentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Transparent)
    $previousCompositingMode = $canvas["Graphics"].CompositingMode
    $canvas["Graphics"].CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    Draw-ReferenceGlyph -Graphics $canvas["Graphics"] -CenterX 360 -CenterY 360 -GlyphSize 430 -CutoutBrush $transparentBrush
    $canvas["Graphics"].CompositingMode = $previousCompositingMode
    $canvas["Bitmap"].Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $transparentBrush.Dispose()
    $canvas["Graphics"].Dispose()
    $canvas["Bitmap"].Dispose()
}

function Save-Splash {
    param([string]$TargetPath)

    # 功能目的：生成 Expo 启动页图片；实现原因：白底居中图标可适配不同手机屏幕
    $canvas = New-Canvas -CanvasWidth 1242 -CanvasHeight 2688
    $whiteBrush = New-BrandBrush "#FFFFFF"
    Draw-ReferenceGlyph -Graphics $canvas["Graphics"] -CenterX 621 -CenterY 1344 -GlyphSize 330 -CutoutBrush $whiteBrush
    $canvas["Bitmap"].Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $whiteBrush.Dispose()
    $canvas["Graphics"].Dispose()
    $canvas["Bitmap"].Dispose()
}

$iconPath = Join-Path $assetDirectory "icon.png"
$adaptiveIconPath = Join-Path $assetDirectory "adaptive-icon.png"
$splashLogoPath = Join-Path $assetDirectory "splash-logo.png"
$splashPath = Join-Path $assetDirectory "splash.png"

Save-Icon $iconPath
Save-Icon $adaptiveIconPath
Save-SplashLogo $splashLogoPath
Save-Splash $splashPath

Get-ChildItem -File $assetDirectory | Select-Object FullName, Length
