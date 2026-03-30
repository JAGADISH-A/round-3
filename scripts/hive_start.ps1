# BumbleBee AI - Unified Hive Startup script
# This script starts ALL services concurrently: Gateway, Intelligence, Vision, Bot, and Frontend.

Write-Host "`n[INFO] Initializing BumbleBee AI Hive..." -ForegroundColor Yellow

# 1. Cleanup
Write-Host "[INFO] Clearing existing processes..." -ForegroundColor Gray
try {
    Stop-Process -Name "python", "node", "java" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch { }

# 1.1 Pre-Flight Checks (Dependencies & Secrets)
Write-Host "`n[PRE-FLIGHT] Verifying system dependencies..." -ForegroundColor Cyan

# Check ffmpeg
$ffmpegCheck = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegCheck) {
    Write-Host "[ERROR] 'ffmpeg' not found in system PATH. Voice processing WILL fail!" -ForegroundColor Red
    Write-Host "[FIX] Install via: 'choco install ffmpeg' (Admin) or download from https://ffmpeg.org/" -ForegroundColor Yellow
} else {
    Write-Host "[OK] ffmpeg verified: $($ffmpegCheck.Source)" -ForegroundColor Green
}

# Check Telegram Token
$envPath = "ai-service\intelligence-service\.env"
if (Test-Path $envPath) {
    $token = Select-String -Path $envPath -Pattern "TELEGRAM_BOT_TOKEN=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }
    if ($token -eq "your_token_here" -or [string]::IsNullOrWhiteSpace($token)) {
        Write-Host "[ERROR] TELEGRAM_BOT_TOKEN is missing or default in $envPath" -ForegroundColor Red
        Write-Host "[FIX] Open $envPath and replace 'your_token_here' with your real bot token." -ForegroundColor Yellow
        $preventStart = $true
    } else {
        Write-Host "[OK] Telegram Token configured." -ForegroundColor Green
    }
} else {
    Write-Host "[ERROR] .env file missing in ai-service\intelligence-service\" -ForegroundColor Red
    Write-Host "[FIX] I have created an empty .env file. Please fill in your token." -ForegroundColor Yellow
    $preventStart = $true
}

if ($preventStart) {
    Write-Host "`n[FAIL] Startup halted due to missing configuration. Fix the errors above and run again.`n" -ForegroundColor Red
    exit
}

# 2. Start Services
Write-Host "`n[STARTING] Launching services in background..." -ForegroundColor Cyan

# Gateway (Java)
Write-Host " -> Gateway (8080)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; mvn spring-boot:run" -WindowStyle Normal

# Intelligence (8001)
Write-Host " -> Intelligence AI (8001)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service\intelligence-service; .\venv\Scripts\python.exe -m main" -WindowStyle Normal

# Vision (8002)
Write-Host " -> Vision AI (8002)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service\vision-service; .\venv\Scripts\python.exe main.py" -WindowStyle Normal

# Telegram Bot
Write-Host " -> Telegram Bot" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service\intelligence-service; .\venv\Scripts\python.exe -m telegram_bot.bot" -WindowStyle Normal

# Frontend (3002)
Write-Host " -> Next.js Frontend (3002)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- -p 3002" -WindowStyle Normal

Write-Host "`n[INFO] Waiting 45s for full initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 45

Write-Host "`n[READY] Hive is fully active!" -ForegroundColor Green
Write-Host "[URL] Frontend: http://localhost:3002"
Write-Host "[URL] Gateway: http://localhost:8080"
Write-Host "[BOT] Telegram Bot is listening...`n"
