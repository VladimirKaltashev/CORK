<#
.SYNOPSIS
    Stop the local Supabase stack (Docker containers stay, data preserved).

.DESCRIPTION
    Calls "supabase stop" so Postgres / Auth / Studio / Realtime / Storage
    containers are shut down cleanly. The DB volume is preserved — next
    "supabase start" restores the same data.

    Vite is not affected (it lives in your foreground terminal; close it with
    Ctrl+C). Docker Desktop is also left running.

.PARAMETER NoBackup
    Pass --no-backup to "supabase stop" (no DB dump before shutdown).

.EXAMPLE
    .\stop.ps1
#>
param(
    [switch]$NoBackup
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$SupabaseExe = Join-Path $PSScriptRoot 'supabase\supabase.exe'

function Write-Section($title) {
    Write-Host ''
    Write-Host "==> $title" -ForegroundColor Cyan
}

Write-Section 'Supabase'
if (-not (Test-Path $SupabaseExe)) {
    Write-Host "Supabase CLI not found at $SupabaseExe" -ForegroundColor Red
    Write-Host 'Place supabase.exe into ./supabase/ or edit the path in stop.ps1.'
    exit 1
}

try {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Docker Desktop is not running — nothing to stop.' -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host 'Docker Desktop is not running — nothing to stop.' -ForegroundColor Yellow
    exit 0
}

Write-Host 'Stopping Supabase containers...'
if ($NoBackup) {
    & $SupabaseExe stop --no-backup
} else {
    & $SupabaseExe stop
}

if ($LASTEXITCODE -ne 0) {
    Write-Host 'Supabase stop failed.' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'Done. DB volume preserved — run .\start.ps1 to resume.' -ForegroundColor Green
