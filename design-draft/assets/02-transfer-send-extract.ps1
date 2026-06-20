Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$SourceImagePath = 'F:\workSpace2029\nulla\design-draft\02-transfer-send.png'
$OutputDirectory = 'F:\workSpace2029\nulla\design-draft\assets\02-transfer-send'
$RawOutputDirectory = Join-Path $OutputDirectory 'raw'

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $RawOutputDirectory | Out-Null

function New-TransparentBitmap {
    param(
        [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$SourceBitmap,
        [Parameter(Mandatory = $true)][string]$Mode
    )

    $targetBitmap = New-Object System.Drawing.Bitmap $SourceBitmap.Width, $SourceBitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($pixelY = 0; $pixelY -lt $SourceBitmap.Height; $pixelY++) {
        for ($pixelX = 0; $pixelX -lt $SourceBitmap.Width; $pixelX++) {
            $sourceColor = $SourceBitmap.GetPixel($pixelX, $pixelY)
            $alpha = 255

            if ($Mode -eq 'Light') {
                $isLightBackground = $sourceColor.R -ge 245 -and $sourceColor.G -ge 245 -and $sourceColor.B -ge 245
                if ($isLightBackground) {
                    $alpha = 0
                }
            }

            if ($Mode -eq 'Dark') {
                $isDarkBackground = $sourceColor.R -le 18 -and $sourceColor.G -le 18 -and $sourceColor.B -le 22
                if ($isDarkBackground) {
                    $alpha = 0
                }
            }

            $targetColor = [System.Drawing.Color]::FromArgb($alpha, $sourceColor.R, $sourceColor.G, $sourceColor.B)
            $targetBitmap.SetPixel($pixelX, $pixelY, $targetColor)
        }
    }

    return $targetBitmap
}

function Export-Crop {
    param(
        [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$SourceBitmap,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][int]$X,
        [Parameter(Mandatory = $true)][int]$Y,
        [Parameter(Mandatory = $true)][int]$Width,
        [Parameter(Mandatory = $true)][int]$Height,
        [Parameter(Mandatory = $true)][string]$TransparentMode
    )

    if ($X -lt 0 -or $Y -lt 0 -or $Width -le 0 -or $Height -le 0) {
        throw "无效裁切参数: $Name"
    }

    if (($X + $Width) -gt $SourceBitmap.Width -or ($Y + $Height) -gt $SourceBitmap.Height) {
        throw "裁切范围越界: $Name"
    }

    $cropRectangle = New-Object System.Drawing.Rectangle $X, $Y, $Width, $Height
    $cropBitmap = $SourceBitmap.Clone($cropRectangle, $SourceBitmap.PixelFormat)
    $outputPath = Join-Path $OutputDirectory $Name
    $rawOutputPath = Join-Path $RawOutputDirectory $Name

    $cropBitmap.Save($rawOutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    if ($TransparentMode -eq 'None') {
        $cropBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropBitmap.Dispose()
        return
    }

    $transparentBitmap = New-TransparentBitmap -SourceBitmap $cropBitmap -Mode $TransparentMode
    $transparentBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $transparentBitmap.Dispose()
    $cropBitmap.Dispose()
}

$sourceBitmap = [System.Drawing.Bitmap]::FromFile($SourceImagePath)

try {
    $assets = @(
        @{ Name = 'background-route-card.png'; X = 26; Y = 226; Width = 800; Height = 370; TransparentMode = 'None' },
        @{ Name = 'background-route-artwork.png'; X = 366; Y = 248; Width = 430; Height = 318; TransparentMode = 'None' },
        @{ Name = 'background-confirm-button.png'; X = 29; Y = 1531; Width = 793; Height = 96; TransparentMode = 'None' },
        @{ Name = 'brand-sol.png'; X = 34; Y = 38; Width = 154; Height = 48; TransparentMode = 'Light' },
        @{ Name = 'icon-top-scan.png'; X = 690; Y = 42; Width = 48; Height = 45; TransparentMode = 'Light' },
        @{ Name = 'icon-profile-circle.png'; X = 771; Y = 40; Width = 53; Height = 53; TransparentMode = 'Light' },
        @{ Name = 'icon-back.png'; X = 40; Y = 145; Width = 22; Height = 34; TransparentMode = 'Light' },
        @{ Name = 'icon-route-info.png'; X = 162; Y = 264; Width = 26; Height = 26; TransparentMode = 'Dark' },
        @{ Name = 'icon-shield-blue.png'; X = 55; Y = 322; Width = 58; Height = 58; TransparentMode = 'Dark' },
        @{ Name = 'icon-mask-purple.png'; X = 55; Y = 421; Width = 58; Height = 58; TransparentMode = 'Dark' },
        @{ Name = 'icon-card-sol.png'; X = 582; Y = 289; Width = 91; Height = 80; TransparentMode = 'Dark' },
        @{ Name = 'icon-address-contact.png'; X = 648; Y = 718; Width = 43; Height = 41; TransparentMode = 'Light' },
        @{ Name = 'icon-input-scan.png'; X = 729; Y = 719; Width = 42; Height = 38; TransparentMode = 'Light' },
        @{ Name = 'icon-route-line.png'; X = 56; Y = 1421; Width = 96; Height = 42; TransparentMode = 'Light' },
        @{ Name = 'icon-chevron-right.png'; X = 767; Y = 1431; Width = 22; Height = 31; TransparentMode = 'Light' },
        @{ Name = 'nav-assets-active.png'; X = 73; Y = 1723; Width = 53; Height = 50; TransparentMode = 'Light' },
        @{ Name = 'nav-privacy.png'; X = 238; Y = 1726; Width = 48; Height = 49; TransparentMode = 'Light' },
        @{ Name = 'nav-contract.png'; X = 405; Y = 1726; Width = 45; Height = 50; TransparentMode = 'Light' },
        @{ Name = 'nav-dpos.png'; X = 570; Y = 1724; Width = 51; Height = 52; TransparentMode = 'Light' },
        @{ Name = 'nav-account.png'; X = 736; Y = 1725; Width = 49; Height = 51; TransparentMode = 'Light' }
    )

    foreach ($asset in $assets) {
        Export-Crop -SourceBitmap $sourceBitmap -Name $asset.Name -X $asset.X -Y $asset.Y -Width $asset.Width -Height $asset.Height -TransparentMode $asset.TransparentMode
    }
} finally {
    $sourceBitmap.Dispose()
}

Get-ChildItem -LiteralPath $OutputDirectory -Filter '*.png' | Sort-Object Name | Select-Object Name, Length
