# BumbleBee AI - Hive Startup Script (Hardened)
# This script starts all Hive services concurrently.

Write-Host "`n[INFO] Starting BumbleBee AI Hive..." -ForegroundColor Yellow

# 1. Kill potentially hanging processes (Node, Python)
Write-Host "[INFO] Clearing existing processes on ports 8001, 8002, 3000-3002..." -ForegroundColor Gray
try {
    # Aggressively kill python and node to ensure fresh start
    Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    Write-Host "[WARN] Could not stop some processes. They might be already closed."
}

# 2. Start Intelligence Service (8001)
Write-Host "`n[INTEL] Starting Intelligence Service (8001)..." -ForegroundColor Cyan
$intelCmd = "cd backend\ai-service\intelligence-service; if (!(Test-Path venv\Scripts\python.exe)) { python -m venv venv }; .\venv\Scripts\python.exe -m pip install -r requirements.txt; .\venv\Scripts\python.exe main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $intelCmd -WindowStyle Normal

# 3. Start Vision AI Service (8002)
Write-Host "[VISION] Starting Vision AI Service (8002)..." -ForegroundColor Cyan
$visionCmd = "cd backend\ai-service\vision-service; if (!(Test-Path venv\Scripts\python.exe)) { python -m venv venv }; .\venv\Scripts\python.exe -m pip install -r requirements.txt; .\venv\Scripts\python.exe main.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $visionCmd -WindowStyle Normal

# 4. Start Next.js Frontend (3002)
Write-Host "[WEB] Starting BumbleBee Frontend (3002)..." -ForegroundColor Cyan
$webCmd = "cd frontend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $webCmd -WindowStyle Normal

Write-Host "`n[INFO] Waiting for Hive to initialize (30s for heavy dependencies)..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# 5. Health Check
Write-Host "`n[CHECK] Running Health Checks..." -ForegroundColor Gray

function Check-Service {
    param($url, $name)
    try {
        $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        if ($resp.status -eq "ok") {
            Write-Host "[SUCCESS] $name is ONLINE" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] $name returned unexpected status: $($resp.status)" -ForegroundColor Red
        }
    } catch {
        Write-Host "[ERROR] $name is OFFLINE at $url" -ForegroundColor Red
    }
}

Check-Service "http://127.0.0.1:8001/health" "Intelligence Service"
Check-Service "http://127.0.0.1:8002/health" "Vision AI Service"

Write-Host "`n[READY] BumbleBee AI Hive is ready!" -ForegroundColor Yellow
Write-Host "[URL] Visit: http://localhost:3002`n"
