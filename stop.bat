@echo off
title Stop Synd.net Suite
echo Stopping all Synd.net servers...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
echo All Synd.net servers stopped cleanly.
timeout /t 2 /nobreak >nul
