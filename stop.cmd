@echo off
REM Wrapper for stop.ps1 so the stack can be stopped by a double-click.
REM Forwards all arguments to PowerShell.
chcp 65001 > nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
