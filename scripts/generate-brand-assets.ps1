$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName WindowsBase, PresentationCore

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetDirectory = Join-Path $projectRoot "assets\brand"
$solanaSvgDirectory = "F:\workSpace2029\ds\Logos\Solana Logotype\SVG"
$iconSvgPath = Join-Path $solanaSvgDirectory "Size=96, Color=color-white.svg"
$splashSvgPath = Join-Path $solanaSvgDirectory "Size=96, Color=color-black.svg"

New-Item -ItemType Directory -Force $assetDirectory | Out-Null

function Assert-FileExists {
    param([string]$FilePath)

    if (Test-Path -LiteralPath $FilePath) {
        return
    }

    throw "缺少文件：$FilePath"
}

function Get-SvgPathItems {
    param(
        [string]$SvgPath,
        [switch]$FirstPathOnly
    )

    # 功能目的：读取 SVG 路径数据；实现原因：App 图标和启动页资源必须从用户指定 SVG 生成
    [xml]$svgDocument = Get-Content -LiteralPath $SvgPath -Encoding UTF8 -Raw
    $namespaceManager = New-Object System.Xml.XmlNamespaceManager($svgDocument.NameTable)
    $namespaceManager.AddNamespace("svg", "http://www.w3.org/2000/svg")
    $pathNodes = @($svgDocument.SelectNodes("//svg:path", $namespaceManager))

    if ($pathNodes.Count -eq 0) {
        throw "SVG 中没有 path：$SvgPath"
    }

    if ($FirstPathOnly) {
        $pathNodes = @($pathNodes[0])
    }

    return @($pathNodes | ForEach-Object {
        [pscustomobject]@{
            Data = $_.GetAttribute("d")
            Fill = $_.GetAttribute("fill")
        }
    })
}

function New-BrushFromFill {
    param([string]$Fill)

    if ($Fill -like "url(*)") {
        $gradientBrush = New-Object System.Windows.Media.LinearGradientBrush
        $gradientBrush.MappingMode = [System.Windows.Media.BrushMappingMode]::Absolute
        $gradientBrush.StartPoint = [System.Windows.Point]::new(11.3861, 98.5375)
        $gradientBrush.EndPoint = [System.Windows.Point]::new(99.4794, -0.769188)
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x99, 0x45, 0xFF), 0.08))
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x87, 0x52, 0xF3), 0.30))
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x54, 0x97, 0xD5), 0.50))
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x43, 0xB4, 0xCA), 0.60))
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x28, 0xE0, 0xB9), 0.72))
        [void]$gradientBrush.GradientStops.Add([System.Windows.Media.GradientStop]::new([System.Windows.Media.Color]::FromRgb(0x19, 0xFB, 0x9B), 0.97))
        return $gradientBrush
    }

    if ([string]::IsNullOrWhiteSpace($Fill)) {
        return [System.Windows.Media.Brushes]::Black
    }

    return New-Object System.Windows.Media.SolidColorBrush ([System.Windows.Media.ColorConverter]::ConvertFromString($Fill))
}

function Get-GeometryRecords {
    param([object[]]$PathItems)

    $records = @()
    $bounds = [System.Windows.Rect]::Empty

    foreach ($pathItem in $PathItems) {
        $geometry = [System.Windows.Media.Geometry]::Parse($pathItem.Data)
        $records += [pscustomobject]@{
            Geometry = $geometry
            Brush = New-BrushFromFill $pathItem.Fill
        }

        if ($bounds.IsEmpty) {
            $bounds = $geometry.Bounds
        } else {
            $bounds.Union($geometry.Bounds)
        }
    }

    return [pscustomobject]@{
        Records = $records
        Bounds = $bounds
    }
}

function Save-VisualPng {
    param(
        [string]$TargetPath,
        [int]$CanvasWidth,
        [int]$CanvasHeight,
        [System.Windows.Media.Brush]$BackgroundBrush,
        [object[]]$PathItems,
        [double]$MaxLogoWidth,
        [double]$MaxLogoHeight,
        [bool]$DrawIconPanel,
        [double]$IconPanelScale = 0.65
    )

    # 功能目的：渲染 SVG 到 PNG；实现原因：Android/Expo 图标入口必须使用位图资源
    $geometryData = Get-GeometryRecords $PathItems
    $sourceBounds = $geometryData.Bounds
    $scale = [Math]::Min($MaxLogoWidth / $sourceBounds.Width, $MaxLogoHeight / $sourceBounds.Height)
    $translateX = ($CanvasWidth / 2) - (($sourceBounds.X + ($sourceBounds.Width / 2)) * $scale)
    $translateY = ($CanvasHeight / 2) - (($sourceBounds.Y + ($sourceBounds.Height / 2)) * $scale)

    $visual = New-Object System.Windows.Media.DrawingVisual
    $drawingContext = $visual.RenderOpen()

    if ($null -ne $BackgroundBrush) {
        $drawingContext.DrawRectangle($BackgroundBrush, $null, [System.Windows.Rect]::new(0, 0, $CanvasWidth, $CanvasHeight))
    }

    if ($DrawIconPanel) {
        # 功能目的：控制桌面图标黑底占比；实现原因：系统图标槽位需要保留呼吸感
        $safeIconPanelScale = [Math]::Min([Math]::Max($IconPanelScale, 0.1), 1)
        $panelSize = $CanvasWidth * $safeIconPanelScale
        $panelRect = [System.Windows.Rect]::new(($CanvasWidth - $panelSize) / 2, ($CanvasHeight - $panelSize) / 2, $panelSize, $panelSize)
        $drawingContext.DrawRoundedRectangle([System.Windows.Media.Brushes]::Black, $null, $panelRect, $panelSize * 0.188, $panelSize * 0.188)
    }

    $transformGroup = New-Object System.Windows.Media.TransformGroup
    [void]$transformGroup.Children.Add([System.Windows.Media.ScaleTransform]::new($scale, $scale))
    [void]$transformGroup.Children.Add([System.Windows.Media.TranslateTransform]::new($translateX, $translateY))
    $drawingContext.PushTransform($transformGroup)

    foreach ($record in $geometryData.Records) {
        $drawingContext.DrawGeometry($record.Brush, $null, $record.Geometry)
    }

    $drawingContext.Pop()
    $drawingContext.Close()

    $bitmap = New-Object System.Windows.Media.Imaging.RenderTargetBitmap -ArgumentList @($CanvasWidth, $CanvasHeight, 96, 96, [System.Windows.Media.PixelFormats]::Pbgra32)
    $bitmap.Render($visual)

    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    [void]$encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $stream = [System.IO.File]::Create($TargetPath)
    try {
        $encoder.Save($stream)
    } finally {
        $stream.Dispose()
    }
}

Assert-FileExists $iconSvgPath
Assert-FileExists $splashSvgPath

$iconPathItems = Get-SvgPathItems -SvgPath $iconSvgPath -FirstPathOnly
$splashPathItems = Get-SvgPathItems -SvgPath $splashSvgPath

$iconPath = Join-Path $assetDirectory "icon.png"
$adaptiveIconPath = Join-Path $assetDirectory "adaptive-icon.png"
$splashLogoPath = Join-Path $assetDirectory "splash-logo.png"
$splashPath = Join-Path $assetDirectory "splash.png"
$iconPanelScale = 0.65
$iconPanelSize = 1024 * $iconPanelScale
$iconLogoSize = [Math]::Round($iconPanelSize * 0.65)

Save-VisualPng -TargetPath $iconPath -CanvasWidth 1024 -CanvasHeight 1024 -BackgroundBrush $null -PathItems $iconPathItems -MaxLogoWidth $iconLogoSize -MaxLogoHeight $iconLogoSize -DrawIconPanel $true -IconPanelScale $iconPanelScale
Save-VisualPng -TargetPath $adaptiveIconPath -CanvasWidth 1024 -CanvasHeight 1024 -BackgroundBrush $null -PathItems $iconPathItems -MaxLogoWidth $iconLogoSize -MaxLogoHeight $iconLogoSize -DrawIconPanel $true -IconPanelScale $iconPanelScale
Save-VisualPng -TargetPath $splashLogoPath -CanvasWidth 646 -CanvasHeight 97 -BackgroundBrush $null -PathItems $splashPathItems -MaxLogoWidth 646 -MaxLogoHeight 97 -DrawIconPanel $false
Save-VisualPng -TargetPath $splashPath -CanvasWidth 1242 -CanvasHeight 2688 -BackgroundBrush ([System.Windows.Media.Brushes]::White) -PathItems $splashPathItems -MaxLogoWidth 570 -MaxLogoHeight 86 -DrawIconPanel $false

Get-ChildItem -File $assetDirectory | Select-Object FullName, Length
