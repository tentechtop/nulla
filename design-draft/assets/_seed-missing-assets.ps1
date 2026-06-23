Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$DraftDirectory = 'F:\workSpace2029\nulla\design-draft'
$AssetDirectory = Join-Path $DraftDirectory 'assets'

function Copy-IfExists {
    param(
        [Parameter(Mandatory = $true)][string]$SourcePath,
        [Parameter(Mandatory = $true)][string]$TargetPath
    )

    if (Test-Path -LiteralPath $SourcePath) {
        Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
    }
}

function Write-TextFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$commonSvgDirectory = Join-Path $AssetDirectory '_common-svg'
New-Item -ItemType Directory -Force -Path $commonSvgDirectory | Out-Null

$commonSvgs = @{
    'icon-copy.svg' = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="13" y="8" width="10" height="12" rx="2" stroke="#7B8494" stroke-width="2.2"/><path d="M9 13V23C9 24.1 9.9 25 11 25H18" stroke="#7B8494" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-chevron-right.svg' = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 7L21 16L12 25" stroke="#9BA0AA" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-search.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="19" cy="19" r="11" stroke="#5F6675" stroke-width="3"/><path d="M27 27L36 36" stroke="#5F6675" stroke-width="3" stroke-linecap="round"/></svg>'
    'icon-filter.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10H36L25 22.5V33L19 36V22.5L8 10Z" stroke="#5F6675" stroke-width="3" stroke-linejoin="round"/></svg>'
    'icon-info.svg' = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="10" stroke="#AEB4C0" stroke-width="2.4"/><circle cx="16" cy="11" r="1.6" fill="#AEB4C0"/><path d="M16 15.5V21.5" stroke="#AEB4C0" stroke-width="2.4" stroke-linecap="round"/></svg>'
    'icon-shield-check.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L32 11.3V20C32 28.8 26.8 34.3 20 37C13.2 34.3 8 28.8 8 20V11.3L20 6Z" stroke="#386CFF" stroke-width="2.6" stroke-linejoin="round"/><path d="M14.8 20.3L18.3 23.8L25.8 16.2" stroke="#386CFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-globe.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="#386CFF" stroke-width="2.6"/><path d="M7 20H33" stroke="#386CFF" stroke-width="2.6" stroke-linecap="round"/><path d="M20 7C24 10.7 26 15 26 20C26 25 24 29.3 20 33" stroke="#386CFF" stroke-width="2.6" stroke-linecap="round"/><path d="M20 7C16 10.7 14 15 14 20C14 25 16 29.3 20 33" stroke="#386CFF" stroke-width="2.6" stroke-linecap="round"/></svg>'
    'icon-lock.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="17" width="22" height="17" rx="3" stroke="#176BFF" stroke-width="2.8"/><path d="M14 17V12C14 8.7 16.7 6 20 6C23.3 6 26 8.7 26 12V17" stroke="#176BFF" stroke-width="2.8" stroke-linecap="round"/><path d="M20 23V27" stroke="#176BFF" stroke-width="2.8" stroke-linecap="round"/></svg>'
    'icon-clock.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="13" stroke="#6A52FF" stroke-width="2.8"/><path d="M20 12V20L25 24" stroke="#6A52FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    'icon-database.svg' = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="11" rx="11" ry="5" stroke="#5F6675" stroke-width="2.6"/><path d="M9 11V29C9 31.8 13.9 34 20 34C26.1 34 31 31.8 31 29V11" stroke="#5F6675" stroke-width="2.6"/><path d="M9 20C9 22.8 13.9 25 20 25C26.1 25 31 22.8 31 20" stroke="#5F6675" stroke-width="2.6"/></svg>'
    'icon-document.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 7H27L35 15V35C35 36.1 34.1 37 33 37H13C11.9 37 11 36.1 11 35V9C11 7.9 11.9 7 13 7Z" stroke="#5F6675" stroke-width="2.8" stroke-linejoin="round"/><path d="M27 7V15H35" stroke="#5F6675" stroke-width="2.8" stroke-linejoin="round"/><path d="M17 24H29" stroke="#5F6675" stroke-width="2.6" stroke-linecap="round"/><path d="M17 31H25" stroke="#5F6675" stroke-width="2.6" stroke-linecap="round"/></svg>'
    'icon-qr.svg' = '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="9" height="9" rx="1" stroke="#176BFF" stroke-width="2.8"/><rect x="27" y="8" width="9" height="9" rx="1" stroke="#176BFF" stroke-width="2.8"/><rect x="8" y="27" width="9" height="9" rx="1" stroke="#176BFF" stroke-width="2.8"/><path d="M27 27H31V31H27V27Z" stroke="#176BFF" stroke-width="2.8" stroke-linejoin="round"/><path d="M35 27V36H27" stroke="#176BFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}

foreach ($entry in $commonSvgs.GetEnumerator()) {
    Write-TextFile -Path (Join-Path $commonSvgDirectory $entry.Key) -Content $entry.Value
}

$backgroundMap = @{
    'validator' = '07-dpos-overview\background-dpos-card-hd.png'
    'dpos' = '07-dpos-overview\background-dpos-card-hd.png'
    'privacy' = '03-privacy-home\background-privacy-card-hd.png'
    'audit' = '04-privacy-audit\background-privacy-audit-card-hd.png'
    'contract' = '06-contract-deploy-confirm\background-contract-deploy-card-hd.png'
    'market' = '48-market-home-multi-asset-draft\background-market-volume-card-hd.png'
    'wallet' = '10-account\background-account-card-hd.png'
    'block' = '15-block-detail\background-block-detail-card-hd.png'
    'scan' = '13-scan-result\background-scan-platform-hd.png'
    'default' = '01-assets-home\hero-card-background.png'
}

function Get-BackgroundKind {
    param([string]$Name)

    if ($Name -match 'validator|dpos|delegation') { return 'validator' }
    if ($Name -match 'privacy|authorization|identity|kyc') { return 'privacy' }
    if ($Name -match 'contract') { return 'contract' }
    if ($Name -match 'rwa|cfd|crypto|stock|market|stablecoin|nft|token|order|portfolio') { return 'market' }
    if ($Name -match 'receive|wallet|address') { return 'wallet' }
    if ($Name -match 'block|transaction|receipt|history|chain|network|rpc|fee|alert|governance') { return 'block' }
    if ($Name -match 'search|notification|security') { return 'scan' }
    return 'default'
}

$missingDrafts = Get-ChildItem -LiteralPath $DraftDirectory -File -Filter '*.png' |
    Where-Object { $_.BaseName -match '^(\d+)-' -and -not (Test-Path -LiteralPath (Join-Path $AssetDirectory $_.BaseName)) } |
    Sort-Object Name

foreach ($draft in $missingDrafts) {
    $targetDirectory = Join-Path $AssetDirectory $draft.BaseName
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null

    $kind = Get-BackgroundKind -Name $draft.BaseName
    $backgroundSource = Join-Path $AssetDirectory $backgroundMap[$kind]
    Copy-IfExists -SourcePath $backgroundSource -TargetPath (Join-Path $targetDirectory "background-$kind-card-hd.png")

    foreach ($commonSvg in Get-ChildItem -LiteralPath $commonSvgDirectory -Filter '*.svg' -File) {
        Copy-Item -LiteralPath $commonSvg.FullName -Destination (Join-Path $targetDirectory $commonSvg.Name) -Force
    }

    if ($draft.BaseName -match 'market|stock|token|rwa|cfd|crypto|stablecoin|nft|order|portfolio') {
        $marketSources = @(
            '48-market-home-multi-asset-draft\icon-token-btc.svg',
            '48-market-home-multi-asset-draft\icon-token-eth.svg',
            '48-market-home-multi-asset-draft\icon-token-sol.svg',
            '48-market-home-multi-asset-draft\icon-stock-apple.svg',
            '48-market-home-multi-asset-draft\icon-asset-xau.svg',
            '48-market-home-multi-asset-draft\icon-asset-nas100.svg',
            '48-market-home-multi-asset-draft\icon-action-swap.svg',
            '48-market-home-multi-asset-draft\icon-action-stock-trade.svg',
            '48-market-home-multi-asset-draft\icon-action-futures.svg',
            '48-market-home-multi-asset-draft\icon-action-order-book.svg'
        )

        foreach ($source in $marketSources) {
            $sourcePath = Join-Path $AssetDirectory $source
            Copy-IfExists -SourcePath $sourcePath -TargetPath (Join-Path $targetDirectory (Split-Path $source -Leaf))
        }
    }

    if ($draft.BaseName -match 'wallet|receive|address') {
        $walletSources = @(
            '10-account\icon-wallet-current.svg',
            '10-account\icon-account-switch.svg',
            '10-account\icon-address-qr.svg',
            '10-account\icon-backup-key.svg',
            '10-account\icon-rpc-globe.svg'
        )

        foreach ($source in $walletSources) {
            $sourcePath = Join-Path $AssetDirectory $source
            Copy-IfExists -SourcePath $sourcePath -TargetPath (Join-Path $targetDirectory (Split-Path $source -Leaf))
        }
    }

    if ($draft.BaseName -match 'validator|dpos|delegation') {
        $dposSources = @(
            '07-dpos-overview\icon-action-stake.svg',
            '07-dpos-overview\icon-action-delegate.svg',
            '07-dpos-overview\icon-action-claim.svg',
            '07-dpos-overview\icon-action-validator.svg',
            '07-dpos-overview\icon-validator-summary.svg'
        )

        foreach ($source in $dposSources) {
            $sourcePath = Join-Path $AssetDirectory $source
            Copy-IfExists -SourcePath $sourcePath -TargetPath (Join-Path $targetDirectory (Split-Path $source -Leaf))
        }
    }

    if ($draft.BaseName -match 'contract') {
        $contractSources = @(
            '05-contracts-list\icon-deploy-contract.svg',
            '05-contracts-list\icon-contract-pop.svg',
            '06-contract-deploy-confirm\icon-local-verified.svg',
            '06-contract-deploy-confirm\icon-security-review.svg',
            '06-contract-deploy-confirm\icon-permission-create-account.svg',
            '06-contract-deploy-confirm\icon-permission-write.svg',
            '06-contract-deploy-confirm\icon-permission-syscall.svg'
        )

        foreach ($source in $contractSources) {
            $sourcePath = Join-Path $AssetDirectory $source
            Copy-IfExists -SourcePath $sourcePath -TargetPath (Join-Path $targetDirectory (Split-Path $source -Leaf))
        }
    }

    $readme = "# $($draft.BaseName) 静态资源`r`n`r`n第一轮高保真资源补齐：包含页面类型匹配的高清背景图和通用 SVG ICON。后续可按红框或具体图标进行单页精修。`r`n"
    Write-TextFile -Path (Join-Path $targetDirectory 'README.md') -Content $readme
}

$created = $missingDrafts | ForEach-Object { Join-Path $AssetDirectory $_.BaseName }
$created | ForEach-Object {
    $svgCount = (Get-ChildItem -LiteralPath $_ -Filter '*.svg' -File).Count
    $imageCount = (Get-ChildItem -LiteralPath $_ -Filter '*.png' -File).Count
    [PSCustomObject]@{ Directory = Split-Path $_ -Leaf; SvgCount = $svgCount; ImageCount = $imageCount }
} | Format-Table -AutoSize
