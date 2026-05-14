#Requires -Version 5.1
<#
.SYNOPSIS
    Renames upload files in public/uploads/settings to match code references.

.DESCRIPTION
    Fixes the following filename mismatches that cause Next.js 404 errors:
    - equip-1.jfif -> equip-1.png
    - equip-2.jfif -> equip-2.png
    - equip-3.jfif -> equip-3.png
    - slide-1.jpg   -> slide-1-pic.jpg
    - slide -2 .jpg -> slide-2-pic.jpg  (handles spaces)

.USAGE
    Right-click → "Run with PowerShell"
    Or in terminal: .\scripts\rename-uploads.ps1
#>

$ErrorActionPreference = "Stop"

$baseDir = Join-Path $PSScriptRoot ".." "public" "uploads" "settings" | Resolve-Path
Write-Host "Working directory: $baseDir" -ForegroundColor Cyan

# ─── 1. Rename .jfif -> .png ──────────────────────────────────
$jfifMap = @{
    "equip-1.jfif" = "equip-1.png"
    "equip-2.jfif" = "equip-2.png"
    "equip-3.jfif" = "equip-3.png"
}

foreach ($oldName in $jfifMap.Keys) {
    $oldPath = Join-Path $baseDir $oldName
    $newPath = Join-Path $baseDir $jfifMap[$oldName]

    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "  SKIP: $($jfifMap[$oldName]) already exists" -ForegroundColor Yellow
        } else {
            Rename-Item -Path $oldPath -NewName $jfifMap[$oldName]
            Write-Host "  RENAME: $oldName -> $($jfifMap[$oldName])" -ForegroundColor Green
        }
    } else {
        Write-Host "  MISSING: $oldName not found in folder" -ForegroundColor Red
    }
}

# ─── 2. Rename slide-1.jpg -> slide-1-pic.jpg ───────────────────
$slide1Old = Join-Path $baseDir "slide-1.jpg"
$slide1New = Join-Path $baseDir "slide-1-pic.jpg"

if (Test-Path $slide1Old) {
    if (Test-Path $slide1New) {
        Write-Host "  SKIP: slide-1-pic.jpg already exists" -ForegroundColor Yellow
    } else {
        Rename-Item -Path $slide1Old -NewName "slide-1-pic.jpg"
        Write-Host "  RENAME: slide-1.jpg -> slide-1-pic.jpg" -ForegroundColor Green
    }
} else {
    Write-Host "  MISSING: slide-1.jpg not found in folder" -ForegroundColor Red
}

# ─── 3. Rename 'slide -2 .jpg' (with spaces) -> slide-2-pic.jpg ─
# Use literal path to handle the spaces correctly
$slide2Old = Join-Path $baseDir "slide -2 .jpg"
$slide2New = Join-Path $baseDir "slide-2-pic.jpg"

if (Test-Path -LiteralPath $slide2Old) {
    if (Test-Path $slide2New) {
        Write-Host "  SKIP: slide-2-pic.jpg already exists" -ForegroundColor Yellow
    } else {
        Rename-Item -LiteralPath $slide2Old -NewName "slide-2-pic.jpg"
        Write-Host "  RENAME: 'slide -2 .jpg' -> slide-2-pic.jpg" -ForegroundColor Green
    }
} else {
    Write-Host "  MISSING: 'slide -2 .jpg' not found in folder" -ForegroundColor Red
}

Write-Host "`nDone. Restart your Next.js dev server if it is running." -ForegroundColor Cyan
