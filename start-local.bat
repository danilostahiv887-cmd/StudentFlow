@echo off
chcp 65001 >nul
setlocal EnableExtensions
cd /d "%~dp0"
title StudentFlow Supabase launcher

echo.
echo === StudentFlow Supabase launcher ===

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js LTS and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js LTS and run this file again.
  pause
  exit /b 1
)

where pwsh >nul 2>&1
if errorlevel 1 (
  echo [ERROR] PowerShell 7 ^(pwsh^) was not found.
  pause
  exit /b 1
)

if not exist ".env" (
  echo [ERROR] .env was not found. Copy .env.example to .env and fill Supabase and ImageKit keys.
  pause
  exit /b 1
)

if not exist "node_modules\next\package.json" (
  echo [1/6] Installing dependencies.
  call npm install
  if errorlevel 1 (
    echo [ERROR] Dependencies could not be installed.
    pause
    exit /b 1
  )
) else (
  echo [1/6] Dependencies are already installed.
)

echo [2/6] Checking Supabase configuration.
pwsh -NoProfile -Command "$envFile = Get-Content -LiteralPath '.env' -Raw; $required = @('NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_DB_URL'); foreach ($name in $required) { if ($envFile -notmatch ('(?m)^' + [regex]::Escape($name) + '=.+' )) { Write-Error ('Missing value in .env: ' + $name); exit 1 } }; Write-Host 'Supabase configuration is present.'"
if errorlevel 1 (
  echo [ERROR] Fill .env before startup.
  pause
  exit /b 1
)

echo [3/6] Preparing Supabase ^(seed only when empty^).
call npm run setup
if errorlevel 1 (
  echo [ERROR] Supabase/ImageKit setup failed. Check .env values and network access.
  pause
  exit /b 1
)

echo [4/6] Building production version.
call npm run build
if errorlevel 1 (
  echo [ERROR] Production build failed. Check the messages above.
  pause
  exit /b 1
)

for /f %%P in ('pwsh -NoProfile -Command "$port = 3000; while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { $port++ }; Write-Output $port"') do set "PORT=%%P"
set "APP_URL=http://127.0.0.1:%PORT%"

echo [5/6] Starting StudentFlow on %APP_URL%
start "StudentFlow Server" /min cmd /c "npm run start -- --hostname 127.0.0.1 --port %PORT%"

echo [6/6] Waiting for the server and opening the browser.
pwsh -NoProfile -Command "$url = '%APP_URL%'; $deadline = (Get-Date).AddSeconds(90); while ((Get-Date) -lt $deadline) { try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { Start-Process $url; Write-Host ('StudentFlow opened: ' + $url); exit 0 } } catch {}; Start-Sleep -Seconds 1 }; Write-Error ('Server did not respond within 90 seconds: ' + $url); exit 1"
if errorlevel 1 (
  echo [ERROR] Server did not become available. Check the StudentFlow Server window.
  pause
  exit /b 1
)

exit /b 0
