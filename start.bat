@echo off
title Synd.net Recon Suite
echo ====================================================
echo 🚀 STARTING SYND.NET & SYNC SERVER
echo ====================================================
cd /d "%~dp0"

echo [1/2] Starting Live Sync Server (Port 3001)...
start "Synd.net Sync Server" /min cmd /c "node scripts\syncServer.cjs"

echo [2/2] Starting Web Application (Port 3000)...
timeout /t 1 /nobreak >nul
start "" "http://localhost:3000"
npm.cmd run dev
