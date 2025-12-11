# Skyline Project - Production Test Script (PowerShell)
# Run this to test if your production setup is working correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Skyline Project - Production Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing production setup..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Testing if server is running on port 5000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq 200) { "Green" } else { "Red" })
    if ($response.StatusCode -ne 200) {
        Write-Host "[ERROR] Server is not responding properly" -ForegroundColor Red
        Write-Host "Start it with: npm start" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[ERROR] Server is not responding. Start it with: npm start" -ForegroundColor Red
    Write-Host ""
    $null = Read-Host "Press Enter to exit"
    exit 1
}

# Test 2: Check database connectivity
Write-Host ""
Write-Host "2. Testing database connectivity..." -ForegroundColor Yellow
try {
    $healthData = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing | ConvertFrom-Json
    if ($healthData.status -eq "healthy") {
        Write-Host "[OK] Database connection healthy" -ForegroundColor Green
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "   Environment: $($healthData.environment)" -ForegroundColor Gray
        Write-Host "   Timestamp: $($healthData.timestamp)" -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] Database connection failed" -ForegroundColor Red
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Red
        Write-Host "   Error: $($healthData.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to check database health" -ForegroundColor Red
}

# Test 3: Check if celebrities endpoint works
Write-Host ""
Write-Host "3. Testing celebrities endpoint..." -ForegroundColor Yellow
try {
    $celebrities = Invoke-WebRequest -Uri "http://localhost:5000/api/celebrities" -UseBasicParsing | ConvertFrom-Json
    if ($celebrities -is [array]) {
        Write-Host "[OK] Celebrities endpoint working" -ForegroundColor Green
        Write-Host "   Found $($celebrities.Count) celebrities" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] Celebrities endpoint may not be working" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Celebrities endpoint not accessible" -ForegroundColor Yellow
    Write-Host "   This may be expected if no celebrities exist in the database" -ForegroundColor Gray
}

# Test 4: Check build output
Write-Host ""
Write-Host "4. Checking if production build exists..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "[OK] Production build found" -ForegroundColor Green
    $distFiles = Get-ChildItem -Path "dist" -Recurse -File | Select-Object -First 5
    Write-Host "   Build files:" -ForegroundColor Gray
    foreach ($file in $distFiles) {
        Write-Host "   - $($file.Name)" -ForegroundColor Gray
    }
    if ((Get-ChildItem -Path "dist" -Recurse -File).Count -gt 5) {
        Write-Host "   ... and more" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARNING] No production build found" -ForegroundColor Yellow
    Write-Host "   Run: npm run build" -ForegroundColor Gray
}

# Test 5: Check environment variables
Write-Host ""
Write-Host "5. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[OK] Environment file exists" -ForegroundColor Green
    $envContent = Get-Content ".env"
    if ($envContent | Select-String "DATABASE_URL") {
        Write-Host "   DATABASE_URL: Configured" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] DATABASE_URL not found in .env file" -ForegroundColor Yellow
    }
    if ($envContent | Select-String "SESSION_SECRET") {
        Write-Host "   SESSION_SECRET: Configured" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] SESSION_SECRET not found in .env file" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] No .env file found" -ForegroundColor Yellow
    Write-Host "   Create .env file with DATABASE_URL and SESSION_SECRET" -ForegroundColor Gray
}

# Test 6: Check node_modules
Write-Host ""
Write-Host "6. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
    $nodeModulesCount = (Get-ChildItem -Path "node_modules" -Directory).Count
    Write-Host "   Installed packages: $nodeModulesCount" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] No dependencies found" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If all tests show [OK], your production setup is working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Additional testing commands:" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:5000" -ForegroundColor Gray
Write-Host "- Health Check: http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host "- API Test: curl http://localhost:5000/api/celebrities" -ForegroundColor Gray
Write-Host ""
Write-Host "For load testing, you can use:" -ForegroundColor Yellow
Write-Host "- Apache Bench: ab -n 1000 -c 10 http://localhost:5000/" -ForegroundColor Gray
Write-Host "- Artillery: npm install -g artillery" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")