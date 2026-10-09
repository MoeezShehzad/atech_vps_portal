@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title ATECH Cloud Hyper-V Host Agent

:: Check for administrative permissions
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ======================================================================
    echo  [UAC] Administrator privileges required for Hyper-V management.
    echo  Prompting Windows UAC elevation now...
    echo ======================================================================
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/k cd /d \"%~dp0\" && start_hyperv_agent.bat' -Verb RunAs"
    exit /b
)

:: Disable QuickEdit mode so selecting text does not pause agent execution
reg add "HKCU\Console" /v QuickEdit /t REG_DWORD /d 0 /f >nul 2>&1

:: Add current user to Hyper-V Administrators group
net localgroup "Hyper-V Administrators" "%USERNAME%" /add >nul 2>&1

:: Free port 5050 if occupied
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5050 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: Configure localhost port forwarders to Ubuntu VM for Google OAuth & Portal access
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=127.0.0.1 connectport=5000 connectaddress=172.19.124.110 >nul 2>&1
netsh interface portproxy add v4tov4 listenport=5174 listenaddress=127.0.0.1 connectport=5174 connectaddress=172.19.124.110 >nul 2>&1

cls
color 0A
echo ======================================================================
echo    ATECH CLOUD - HYPER-V HOST AGENT (RUNNING AS ADMINISTRATOR)
echo ======================================================================
echo  [+] Windows Host: %COMPUTERNAME% (User: %USERNAME%)
echo  [+] Status: ELEVATED (Hyper-V Access Granted)
echo  [+] Listening on: http://0.0.0.0:5050
echo  [+] IPs: 172.25.80.1 (WSL/Hyper-V) ^| 192.168.100.92 (Wi-Fi)
echo.
echo  Testing Hyper-V communication...
powershell -NoProfile -Command "Get-VM -ErrorAction SilentlyContinue | Format-Table Name, State, CPUUsage, MemoryAssigned -AutoSize"
echo.
echo  [OK] Agent is active and listening for VM creation / actions from Ubuntu Portal.
echo  [!] KEEP THIS WINDOW OPEN while using the ATECH VPS Portal.
echo ======================================================================
echo.

node hyperv_agent.js
pause
