@echo off
echo ========================================
echo Skyline Project - Production Test Script
echo ========================================
echo.

setlocal enabledelayedexpansion

echo Testing production setup...
echo.

:: Test 1: Check if server is running
echo 1. Testing if server is running on port 5000...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5000/api/health
if %errorlevel% neq 0 (
    echo [ERROR] Server is not responding. Start it with: npm start
    goto :end
)

:: Test 2: Check database connectivity
echo.
echo 2. Testing database connectivity...
curl -s http://localhost:5000/api/health | findstr "healthy"
if %errorlevel% neq 0 (
    echo [ERROR] Database connection failed
    goto :end
)
echo [OK] Database connection healthy

:: Test 3: Check if celebrities endpoint works
echo.
echo 3. Testing celebrities endpoint...
curl -s http://localhost:5000/api/celebrities | findstr "\["
if %errorlevel% neq 0 (
    echo [WARNING] Celebrities endpoint may not be working
) else (
    echo [OK] Celebrities endpoint working
)

:: Test 4: Check build output
echo.
echo 4. Checking if production build exists...
if exist "dist" (
    echo [OK] Production build found
    dir dist /b
) else (
    echo [WARNING] No production build found. Run: npm run build
)

:: Test 5: Check environment variables
echo.
echo 5. Checking environment variables...
if exist ".env" (
    echo [OK] Environment file exists
    type .env | findstr "DATABASE_URL"
    if %errorlevel% neq 0 (
        echo [WARNING] DATABASE_URL not found in .env file
    )
) else (
    echo [WARNING] No .env file found
)

:: Test 6: Check node_modules
echo.
echo 6. Checking dependencies...
if exist "node_modules" (
    echo [OK] Dependencies installed
) else (
    echo [ERROR] No dependencies found. Run: npm install
    goto :end
)

echo.
echo ========================================
echo Test Results Summary
echo ========================================
echo.
echo If all tests show [OK], your production setup is working correctly!
echo.
echo Additional testing commands:
echo - Frontend: http://localhost:5000
echo - Health Check: http://localhost:5000/api/health
echo - API Test: curl http://localhost:5000/api/celebrities
echo.
echo For load testing, you can use:
echo - Apache Bench: ab -n 1000 -c 10 http://localhost:5000/
echo - Artillery: npm install -g artillery ^&^& artillery run test.yml
echo.

:end
echo Press any key to exit...
pause > nul