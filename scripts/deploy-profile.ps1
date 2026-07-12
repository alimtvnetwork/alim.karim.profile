<#
.SYNOPSIS
    Deploy the public profile (README + markdown + assets) to a target folder
    (typically a clone of the GitHub profile repo), using an explicit allow-list
    AND respecting .deployignore.

.DESCRIPTION
    Only copies files belonging to the public profile package:
      - Root markdown pages (README, profile, FAQ, Why-*, Riseup-Asia-*, etc.)
      - experience/**, why-hire/**, faq/**, skills/**
      - assets/**, img/** (images only)
      - Alim-Ul-Karim-Tech-Stack-Skills-*.md

    Excludes (via .deployignore + hard rules):
      - legacy CV.md / *.pdf paths (CV has been removed from this repo)
      - .git, .lovable, node_modules, dist, .output, .tanstack, .wrangler
      - src/, public/, scripts/, .github/, configs, lockfiles, tsconfig, vite/app config

    Validates first with `bun run check:links` so a broken mirror is never
    published.

.PARAMETER Target
    Destination folder (usually a checkout of the GitHub profile repo,
    e.g. C:\repos\aukgit\aukgit).

.PARAMETER SkipLinkCheck
    Skip the `bun run check:links` gate. Not recommended.

.PARAMETER WhatIf
    Show what would be copied without writing anything.

.EXAMPLE
    pwsh ./scripts/deploy-profile.ps1 -Target C:\repos\aukgit\aukgit

.EXAMPLE
    pwsh ./scripts/deploy-profile.ps1 -Target ../aukgit -WhatIf
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [string] $Target,

    [switch] $SkipLinkCheck
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# --- Resolve repo root (this script lives in <root>/scripts) -----------------
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $RepoRoot
Write-Host "Repo root : $RepoRoot"

if (-not (Test-Path $Target)) {
    throw "Target folder '$Target' does not exist. Create it (or clone the profile repo) first."
}
$Target = (Resolve-Path $Target).Path
Write-Host "Target    : $Target"

# --- Allow-list: only these roots are eligible for deployment ----------------
$IncludeRoots = @(
    # Root markdown
    'README.md',
    'alim-ul-karim-profile.md',
    'faq.md',
    'providing-services.md',
    'how-alim-started.md',
    'how-to-hire-best-talent-from-india.md',
    'why-you-should-hire-alim.md',
    'why-you-should-not-hire-alim.md',
    'why-riseup-asia.md',
    'riseup-asia-137-plus-clients-served.md',
    'riseup-asia-california.md',
    'riseup-asia-los-angeles.md',
    'riseup-asia-texas.md',
    'alim-ul-karim-tech-stack-skills-image-format.md',
    'alim-ul-karim-tech-stack-skills-text-format.md',
    'CHANGELOG.md',
    'release-notes.md',
    'VERSION',
    # Folders
    'experience',
    'why-hire',
    'faq',
    'skills',
    'assets',
    'img'
)

# --- Load .deployignore ------------------------------------------------------
$IgnorePath = Join-Path $RepoRoot '.deployignore'
if (-not (Test-Path $IgnorePath)) {
    throw ".deployignore not found at $IgnorePath"
}
$IgnorePatterns = Get-Content $IgnorePath |
    Where-Object { $_ -and -not $_.TrimStart().StartsWith('#') } |
    ForEach-Object { $_.Trim() }
Write-Host "Ignore    : $($IgnorePatterns.Count) patterns loaded"

function Test-Ignored {
    param([string] $RelPath)
    $p = $RelPath -replace '\\', '/'
    foreach ($pat in $IgnorePatterns) {
        $g = $pat -replace '\\', '/'
        if ($p -ilike $g) { return $true }
        if ($g.StartsWith('**/') -and ($p -ilike $g.Substring(3) -or $p -ilike "*/$($g.Substring(3))")) {
            return $true
        }
        if ($g.EndsWith('/**') -and $p -ilike ($g.Substring(0, $g.Length - 3) + '/*')) {
            return $true
        }
    }
    return $false
}

# --- Pre-flight: link checker ------------------------------------------------
if (-not $SkipLinkCheck) {
    Write-Host "`n[1/3] Running link checker (bun run check:links)..." -ForegroundColor Cyan
    & bun run check:links
    if ($LASTEXITCODE -ne 0) {
        throw "Link check failed. Fix issues or re-run with -SkipLinkCheck."
    }
} else {
    Write-Warning "Skipping link check (-SkipLinkCheck)."
}

# --- Enumerate candidate files from the allow-list ---------------------------
Write-Host "`n[2/3] Enumerating allow-listed files..." -ForegroundColor Cyan
$candidates = New-Object System.Collections.Generic.List[System.IO.FileInfo]
foreach ($root in $IncludeRoots) {
    $path = Join-Path $RepoRoot $root
    if (-not (Test-Path -LiteralPath $path)) { continue }
    $entry = Get-Item -LiteralPath $path
    if ($entry.PSIsContainer) {
        Get-ChildItem -LiteralPath $entry.FullName -Recurse -File -Force |
            ForEach-Object { $candidates.Add($_) }
    } else {
        $candidates.Add($entry)
    }
}

$files = @()
foreach ($f in $candidates) {
    $rel = [System.IO.Path]::GetRelativePath($RepoRoot, $f.FullName)
    if (Test-Ignored $rel) { continue }
    $files += ,$f
}

Write-Host ("Will copy : {0} files (from {1} candidates)" -f $files.Count, $candidates.Count)

# --- Copy ---------------------------------------------------------------------
Write-Host "`n[3/3] Copying to target..." -ForegroundColor Cyan
$copied = 0
foreach ($file in $files) {
    $rel = [System.IO.Path]::GetRelativePath($RepoRoot, $file.FullName)
    $dest = Join-Path $Target $rel
    $destDir = Split-Path $dest -Parent
    if ($PSCmdlet.ShouldProcess($rel, "Copy to $dest")) {
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
        Copy-Item -LiteralPath $file.FullName -Destination $dest -Force
        $copied++
    }
}

Write-Host "`nDone. Copied $copied files to $Target" -ForegroundColor Green
Write-Host "Next: cd '$Target' ; git add -A ; git commit -m 'profile: sync from lovable' ; git push"
