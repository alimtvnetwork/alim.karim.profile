<#
.SYNOPSIS
    Thin wrapper that delegates to scripts/deploy-profile.ps1.

.DESCRIPTION
    The canonical deployment logic (allow-list of public MD pages + image
    assets, .deployignore filtering, link-check gate) lives in
    scripts/deploy-profile.ps1. This wrapper exists so the historical
    entry point at the repo root keeps working without duplicating logic.

.PARAMETER Target
    Destination repository folder, e.g. C:\repos\aukgit\aukgit

.PARAMETER SkipLinkCheck
    Forward to deploy-profile.ps1 to skip `bun run check:links`.

.EXAMPLE
    pwsh ./Copy-ProfileFiles.ps1 -Target C:\repos\aukgit\aukgit
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $Target,

    [switch] $SkipLinkCheck
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Deploy   = Join-Path $RepoRoot 'scripts/deploy-profile.ps1'

if (-not (Test-Path -LiteralPath $Deploy)) {
    throw "Canonical deploy script not found at $Deploy"
}

$fwd = @{ Target = $Target }
if ($SkipLinkCheck) { $fwd.SkipLinkCheck = $true }
if ($WhatIfPreference) { $fwd.WhatIf = $true }

& $Deploy @fwd
