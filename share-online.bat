@echo off
title Synd.net Direct Buddy Tunnel
echo ====================================================
echo 🌐 SYND.NET - DIRECT BUDDY CLOUDFLARE TUNNEL
echo ====================================================
echo.
echo Starting direct tunnel to port 3000...
echo NO passwords, NO IP verification required!
echo.
echo Look for the link ending in .trycloudflare.com below:
echo ====================================================
"%~dp0cloudflared.exe" tunnel --url http://localhost:3000
pause
