<#
.SYNOPSIS
    Start the CORK project (Docker + Supabase + Vite) with a single command.

.DESCRIPTION
    Step 1. Ensures Docker Desktop is running (starts it if needed).
    Step 2. Ensures local Supabase stack is running (starts it if needed).
    Step 3. Optionally applies migrations and seed (with -Reset).
    Step 4. Opens the app in the browser (unless -NoBrowser).
    Step 5. Runs the Vite dev-server in the foreground.

.PARAMETER Reset
    Run "supabase db reset" before starting Vite. Use this after schema/seed changes.

.PARAMETER NoBrowser
    Do not open the browser tab automatically.

.EXAMPLE
    .\start.ps1
    Plain start.

.EXAMPLE
    .\start.ps1 -Reset
    Start and re-apply migrations + seed.

.EXAMPLE
    .\start.ps1 -NoBrowser -Reset
    Start, reset DB, but do not open the browser.
#>
param(
    [switch]$Reset,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Use UTF-8 for nicer Supabase CLI output.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

$SupabaseExe      = Join-Path $PSScriptRoot 'supabase\supabase.exe'
$DockerDesktopExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$DevUrl           = 'http://localhost:5173'

function Write-Section($title) {
    Write-Host ''
    Write-Host "==> $title" -ForegroundColor Cyan
}

function Test-DockerRunning {
    try {
        docker info *> $null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Wait-ForDocker {
    param([int]$TimeoutSec = 120)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        if (Test-DockerRunning) { return $true }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host '.' -NoNewline
    }
    return $false
}

function Test-SupabaseRunning {
    try {
        & $SupabaseExe status *> $null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# ── 1. Docker Desktop ─────────────────────────────────────────────────────
Write-Section 'Docker Desktop'
if (Test-DockerRunning) {
    Write-Host 'Already running.'
} else {
    if (-not (Test-Path $DockerDesktopExe)) {
        Write-Host "Docker Desktop not found at $DockerDesktopExe" -ForegroundColor Red
        Write-Host 'Install Docker Desktop or edit the path in start.ps1.'
        exit 1
    }
    Write-Host 'Not running. Launching Docker Desktop...'
    Start-Process -FilePath $DockerDesktopExe | Out-Null
    Write-Host 'Waiting for daemon ' -NoNewline
    if (-not (Wait-ForDocker)) {
        Write-Host ''
        Write-Host 'Docker did not become ready within 2 minutes.' -ForegroundColor Red
        exit 1
    }
    Write-Host ' ready.'
}

# ── 2. Supabase ───────────────────────────────────────────────────────────
Write-Section 'Supabase'
if (-not (Test-Path $SupabaseExe)) {
    Write-Host "Supabase CLI not found at $SupabaseExe" -ForegroundColor Red
    Write-Host 'Place supabase.exe into ./supabase/ (https://supabase.com/docs/guides/cli) or edit the path in start.ps1.'
    exit 1
}

if (Test-SupabaseRunning) {
    Write-Host 'Already running.'
} else {
    Write-Host 'Starting...'
    & $SupabaseExe start
    if ($LASTEXITCODE -ne 0) {
        Write-Host ''
        Write-Host 'Supabase failed to start.' -ForegroundColor Red
        Write-Host 'Common cause on Windows: port 54322 reserved by Hyper-V/WSL.' -ForegroundColor Yellow
        Write-Host 'Fix from an ADMIN PowerShell:' -ForegroundColor Yellow
        Write-Host '  net stop winnat'
        Write-Host "  & '$SupabaseExe' stop"
        Write-Host '  net start winnat'
        Write-Host '  .\start.ps1'
        exit 1
    }
}

# ── 3. Optional: db reset ─────────────────────────────────────────────────
if ($Reset) {
    Write-Section 'Applying migrations + seed (db reset)'
    & $SupabaseExe db reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'db reset failed.' -ForegroundColor Red
        exit 1
    }
}

# ── 4. Browser ────────────────────────────────────────────────────────────
if (-not $NoBrowser) {
    Write-Section 'Opening browser'
    Start-Process $DevUrl | Out-Null
}

# ── 5. Vite dev-server ────────────────────────────────────────────────────
Write-Section 'Vite dev-server'
Write-Host 'Press Ctrl+C to stop the dev-server. Supabase keeps running.'
Write-Host ''
npm run dev
