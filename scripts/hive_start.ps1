# BumbleBee AI - Unified Hive Startup script
# This script starts ALL services concurrently: Gateway, Intelligence, Vision, Bot, and Frontend.

Write-Host "`n[INFO] Initializing BumbleBee AI Hive..." -ForegroundColor Yellow

# 1. Cleanup
Write-Host "[INFO] Clearing existing processes..." -ForegroundColor Gray
try {
    Stop-Process -Name "python", "node", "java" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch { }

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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "`n[INFO] Waiting 45s for full initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 45

Write-Host "`n[READY] Hive is fully active!" -ForegroundColor Green
Write-Host "[URL] Frontend: http://localhost:3002"
Write-Host "[URL] Gateway: http://localhost:8080"
Write-Host "[BOT] Telegram Bot is listening...`n"
