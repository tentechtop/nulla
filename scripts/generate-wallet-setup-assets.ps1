Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$DraftDirectory = 'F:\workSpace2029\nulla\design-draft'
$AssetDirectory = Join-Path $DraftDirectory 'assets'
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false

function New-DirectoryIfMissing {
    param(
        [Parameter(Mandatory = $true)][string]$DirectoryPath
    )

    if (-not (Test-Path -LiteralPath $DirectoryPath)) {
        New-Item -ItemType Directory -Path $DirectoryPath | Out-Null
    }
}

function Write-TextFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBomEncoding)
}

function Write-SvgFile {
    param(
        [Parameter(Mandatory = $true)][string]$DirectoryPath,
        [Parameter(Mandatory = $true)][string]$FileName,
        [Parameter(Mandatory = $true)][string]$SvgContent
    )

    [xml]$SvgDocument = $SvgContent
    Write-TextFile -Path (Join-Path $DirectoryPath $FileName) -Content $SvgDocument.OuterXml
}

function Paint-MaskRectangle {
    param(
        [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
        [Parameter(Mandatory = $true)][hashtable]$Mask
    )

    $maskBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($Mask.Alpha, $Mask.Red, $Mask.Green, $Mask.Blue))
    try {
        $Graphics.FillRectangle($maskBrush, $Mask.X, $Mask.Y, $Mask.Width, $Mask.Height)
    } finally {
        $maskBrush.Dispose()
    }
}

function Export-CardBackground {
    param(
        [Parameter(Mandatory = $true)][string]$SourceImagePath,
        [Parameter(Mandatory = $true)][string]$OutputPath,
        [Parameter(Mandatory = $true)][int]$X,
        [Parameter(Mandatory = $true)][int]$Y,
        [Parameter(Mandatory = $true)][int]$Width,
        [Parameter(Mandatory = $true)][int]$Height,
        [Parameter(Mandatory = $true)][array]$Masks
    )

    $sourceBitmap = [System.Drawing.Bitmap]::FromFile($SourceImagePath)
    try {
        if ($X -lt 0 -or $Y -lt 0 -or $Width -le 0 -or $Height -le 0) {
            throw "Invalid background crop parameters: $OutputPath"
        }

        if (($X + $Width) -gt $sourceBitmap.Width -or ($Y + $Height) -gt $sourceBitmap.Height) {
            throw "Background crop is out of source bounds: $OutputPath"
        }

        $cropRectangle = New-Object System.Drawing.Rectangle $X, $Y, $Width, $Height
        $cropBitmap = $sourceBitmap.Clone($cropRectangle, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $maskedBitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $maskGraphics = [System.Drawing.Graphics]::FromImage($maskedBitmap)

        try {
            $maskGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $maskGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $maskGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $maskGraphics.DrawImage($cropBitmap, 0, 0, $Width, $Height)

            foreach ($mask in $Masks) {
                Paint-MaskRectangle -Graphics $maskGraphics -Mask $mask
            }
        } finally {
            $maskGraphics.Dispose()
            $cropBitmap.Dispose()
        }

        $outputWidth = $Width * 2
        $outputHeight = $Height * 2
        $outputBitmap = New-Object System.Drawing.Bitmap $outputWidth, $outputHeight, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $outputGraphics = [System.Drawing.Graphics]::FromImage($outputBitmap)

        try {
            $outputGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $outputGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $outputGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $outputGraphics.DrawImage($maskedBitmap, 0, 0, $outputWidth, $outputHeight)
            $outputBitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $outputGraphics.Dispose()
            $outputBitmap.Dispose()
            $maskedBitmap.Dispose()
        }
    } finally {
        $sourceBitmap.Dispose()
    }
}

function New-Mask {
    param(
        [Parameter(Mandatory = $true)][int]$X,
        [Parameter(Mandatory = $true)][int]$Y,
        [Parameter(Mandatory = $true)][int]$Width,
        [Parameter(Mandatory = $true)][int]$Height,
        [Parameter(Mandatory = $false)][int]$Alpha = 255
    )

    return @{
        X = $X
        Y = $Y
        Width = $Width
        Height = $Height
        Alpha = $Alpha
        Red = 5
        Green = 5
        Blue = 7
    }
}

$screenDefinitions = @(
    @{
        SourceName = '56-wallet-create-mnemonic-entry.png'
        DirectoryName = '56-wallet-create-mnemonic-entry'
        BackgroundName = 'background-wallet-create-card-hd.png'
        Crop = @{ X = 29; Y = 300; Width = 795; Height = 345 }
        Masks = @(
            (New-Mask -X 36 -Y 70 -Width 485 -Height 118),
            (New-Mask -X 36 -Y 212 -Width 525 -Height 72)
        )
        Readme = 'Wallet create entry assets: SOL cyber card background and setup confirmation SVG icons.'
    },
    @{
        SourceName = '57-wallet-mnemonic-backup-12words.png'
        DirectoryName = '57-wallet-mnemonic-backup-12words'
        BackgroundName = 'background-mnemonic-backup-card-hd.png'
        Crop = @{ X = 29; Y = 286; Width = 795; Height = 320 }
        Masks = @(
            (New-Mask -X 35 -Y 72 -Width 440 -Height 124),
            (New-Mask -X 35 -Y 198 -Width 454 -Height 60)
        )
        Readme = 'Mnemonic backup assets: offline backup cyber background, action icons, and security boundary SVG icons.'
    },
    @{
        SourceName = '58-wallet-switch-account.png'
        DirectoryName = '58-wallet-switch-account'
        BackgroundName = 'background-wallet-switch-card-hd.png'
        Crop = @{ X = 31; Y = 281; Width = 791; Height = 270 }
        Masks = @(
            (New-Mask -X 25 -Y 34 -Width 392 -Height 148),
            (New-Mask -X 405 -Y 90 -Width 144 -Height 72),
            (New-Mask -X 26 -Y 160 -Width 520 -Height 70)
        )
        Readme = 'Wallet switch assets: current wallet cyber card background, local wallet list icons, and confirmation SVG icons.'
    }
)

$sharedSvgs = @{
    'icon-chevron-right.svg' = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7L21 16L12 25" stroke="#737A8D" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-copy.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="9" width="14" height="19" rx="2.5" stroke="#565B6E" stroke-width="2.8"/><path d="M12 16V33C12 34.1 12.9 35 14 35H25" stroke="#565B6E" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-eye.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 22C10.1 14.5 15.4 10.8 22 10.8C28.6 10.8 33.9 14.5 38 22C33.9 29.5 28.6 33.2 22 33.2C15.4 33.2 10.1 29.5 6 22Z" stroke="#565B6E" stroke-width="2.8" stroke-linejoin="round"/><circle cx="22" cy="22" r="5.2" stroke="#565B6E" stroke-width="2.8"/></svg>'
    'icon-shield-check.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 7L39 13.5V24.2C39 35 32.7 41.2 24 44.5C15.3 41.2 9 35 9 24.2V13.5L24 7Z" stroke="#176BFF" stroke-width="3" stroke-linejoin="round"/><path d="M17 24.5L21.8 29.2L31.4 19" stroke="#176BFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-lock.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="11" y="21" width="26" height="19" rx="3.5" stroke="#6A52FF" stroke-width="3"/><path d="M17 21V15C17 11.1 20.1 8 24 8C27.9 8 31 11.1 31 15V21" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M24 28V33" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/></svg>'
    'icon-warning-triangle.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L35 32H5L20 6Z" stroke="#FF8A00" stroke-width="2.8" stroke-linejoin="round"/><path d="M20 16V23" stroke="#FF8A00" stroke-width="2.8" stroke-linecap="round"/><circle cx="20" cy="28" r="1.7" fill="#FF8A00"/></svg>'
    'icon-no-screenshot.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 17V14C13 12.3 14.3 11 16 11H20" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M28 11H32C33.7 11 35 12.3 35 14V17" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M13 31V34C13 35.7 14.3 37 16 37H20" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M28 37H32C33.7 37 35 35.7 35 34V31" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M15 33L33 15" stroke="#6A52FF" stroke-width="3.2" stroke-linecap="round"/><path d="M17 18C19.4 15.8 21.7 14.8 24 14.8C28.9 14.8 32.8 19 35.5 24C34.4 26 33.2 27.7 31.8 29.1" stroke="#6A52FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M26.2 32.8C25.5 33 24.8 33.2 24 33.2C19.1 33.2 15.2 29 12.5 24C13.1 22.9 13.8 21.9 14.6 21" stroke="#6A52FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-offline.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 17C18 8.8 30 8.8 40 17" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M14 24C20.3 18.8 27.7 18.8 34 24" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M20 31C22.7 28.8 25.3 28.8 28 31" stroke="#6A52FF" stroke-width="3" stroke-linecap="round"/><path d="M12 36L36 12" stroke="#6A52FF" stroke-width="3.2" stroke-linecap="round"/></svg>'
    'icon-document.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 7H30L38 15V38C38 39.7 36.7 41 35 41H14C12.3 41 11 39.7 11 38V10C11 8.3 12.3 7 14 7Z" stroke="#13CBB6" stroke-width="3" stroke-linejoin="round"/><path d="M30 7V15H38" stroke="#13CBB6" stroke-width="3" stroke-linejoin="round"/><path d="M17 25H31" stroke="#13CBB6" stroke-width="2.8" stroke-linecap="round"/><path d="M17 32H27" stroke="#13CBB6" stroke-width="2.8" stroke-linecap="round"/></svg>'
    'icon-private-lock.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="11" y="21" width="26" height="19" rx="3.5" stroke="#8A4DFF" stroke-width="3"/><path d="M17 21V15C17 11.1 20.1 8 24 8C27.9 8 31 11.1 31 15V21" stroke="#8A4DFF" stroke-width="3" stroke-linecap="round"/><path d="M24 28V33" stroke="#8A4DFF" stroke-width="3" stroke-linecap="round"/></svg>'
    'icon-card-copy-address.svg' = '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" rx="10" fill="#050507" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.6"/><rect x="30" y="17" width="16" height="25" rx="3" stroke="#FFFFFF" stroke-width="3"/><path d="M21 25V46C21 47.7 22.3 49 24 49H38" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-card-address-qr.svg' = '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" rx="10" fill="#050507" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="1.6"/><rect x="19" y="19" width="9" height="9" rx="1.2" stroke="#FFFFFF" stroke-width="3"/><rect x="36" y="19" width="9" height="9" rx="1.2" stroke="#FFFFFF" stroke-width="3"/><rect x="19" y="36" width="9" height="9" rx="1.2" stroke="#FFFFFF" stroke-width="3"/><path d="M36 36H41V41H36V36Z" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/><path d="M45 36V45H36" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-globe.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="16" stroke="#176BFF" stroke-width="3"/><path d="M8 24H40" stroke="#176BFF" stroke-width="3" stroke-linecap="round"/><path d="M24 8C29 12.6 31.5 17.9 31.5 24C31.5 30.1 29 35.4 24 40" stroke="#176BFF" stroke-width="3" stroke-linecap="round"/><path d="M24 8C19 12.6 16.5 17.9 16.5 24C16.5 30.1 19 35.4 24 40" stroke="#176BFF" stroke-width="3" stroke-linecap="round"/></svg>'
    'icon-add-circle.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="13" stroke="#090A12" stroke-width="2.8"/><path d="M22 15V29" stroke="#090A12" stroke-width="2.8" stroke-linecap="round"/><path d="M15 22H29" stroke="#090A12" stroke-width="2.8" stroke-linecap="round"/></svg>'
    'icon-import-download.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 8V27" stroke="#090A12" stroke-width="2.8" stroke-linecap="round"/><path d="M15 20L22 27L29 20" stroke="#090A12" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 33V36H33V33" stroke="#090A12" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-delete.svg' = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16H35" stroke="#FF2D20" stroke-width="3" stroke-linecap="round"/><path d="M19 16V11H29V16" stroke="#FF2D20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="16" width="16" height="24" rx="2.5" stroke="#FF2D20" stroke-width="3"/><path d="M21 22V34" stroke="#FF2D20" stroke-width="2.6" stroke-linecap="round"/><path d="M27 22V34" stroke="#FF2D20" stroke-width="2.6" stroke-linecap="round"/></svg>'
}

foreach ($screen in $screenDefinitions) {
    $targetDirectory = Join-Path $AssetDirectory $screen.DirectoryName
    New-DirectoryIfMissing -DirectoryPath $targetDirectory

    $sourceImagePath = Join-Path $DraftDirectory $screen.SourceName
    $backgroundPath = Join-Path $targetDirectory $screen.BackgroundName
    Export-CardBackground `
        -SourceImagePath $sourceImagePath `
        -OutputPath $backgroundPath `
        -X $screen.Crop.X `
        -Y $screen.Crop.Y `
        -Width $screen.Crop.Width `
        -Height $screen.Crop.Height `
        -Masks $screen.Masks

    foreach ($svgEntry in $sharedSvgs.GetEnumerator()) {
        Write-SvgFile -DirectoryPath $targetDirectory -FileName $svgEntry.Key -SvgContent $svgEntry.Value
    }

    $readmeContent = "# $($screen.DirectoryName) static assets`r`n`r`n$($screen.Readme)`r`n`r`n- $($screen.BackgroundName): high-fidelity top card background with text and button overlays removed.`r`n- icon-*.svg: vector icons for native page components, without embedded raster data.`r`n"
    Write-TextFile -Path (Join-Path $targetDirectory 'README.md') -Content $readmeContent
}

$screenDefinitions | ForEach-Object {
    $targetDirectory = Join-Path $AssetDirectory $_.DirectoryName
    [PSCustomObject]@{
        Directory = $_.DirectoryName
        PngCount = (Get-ChildItem -LiteralPath $targetDirectory -File -Filter '*.png').Count
        SvgCount = (Get-ChildItem -LiteralPath $targetDirectory -File -Filter '*.svg').Count
    }
} | Format-Table -AutoSize
