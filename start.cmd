@echo off
REM Wrapper for start.ps1 so the project can be launched by a double-click.
REM Forwards all arguments to PowerShell.
chcp 65001 > nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
