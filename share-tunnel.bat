@echo off
title Synd.net Buddy Share Tunnel
echo ====================================================
echo 🌐 SYND.NET - BUDDY PUBLIC SHARE TUNNEL
echo ====================================================
echo.
echo Finding your public IP (needed for your buddy's 1-time verification)...
powershell -NoProfile -Command "$ip = (Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content; Write-Host 'Verification IP to give your buddy: ' -NoNewline; Write-Host $ip -ForegroundColor Yellow"
echo.
echo Starting tunnel for port 3000...
echo.
echo ====================================================
echo Share the URL below with your buddy:
echo ====================================================
npx localtunnel --port 3000
pause
