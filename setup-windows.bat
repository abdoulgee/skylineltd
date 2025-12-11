@echo off
echo ========================================
echo Skyline Project - Windows 10 Setup Script
echo ========================================
echo.

echo Checking prerequisites...
echo.

echo 1. Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

echo 2. Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available
    pause
    exit /b 1
)
echo [OK] npm is available
echo.

echo 3. Checking PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL from https://www.postgresql.org/download/windows/
    echo You can continue, but database features won't work
) else (
    echo [OK] PostgreSQL is installed
)
echo.

echo ========================================
echo Setting up project...
echo ========================================
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo ========================================
echo Database Setup
echo ========================================
echo.

set /p DB_SETUP="Do you want to set up the database now? (y/n): "
if /i "%DB_SETUP%"=="y" (
    echo.
    echo Setting up database...
    
    set /p DB_NAME="Enter database name (default: skyline): "
    if "%DB_NAME%"=="" set DB_NAME=skyline
    
    set /p DB_USER="Enter database user (default: postgres): "
    if "%DB_USER%"=="" set DB_USER=postgres
    
    set /p DB_PASSWORD="Enter database password for %DB_USER%: "
    
    echo.
    echo Creating database %DB_NAME%...
    createdb -U %DB_USER% %DB_NAME%
    if %errorlevel% neq 0 (
        echo [WARNING] Could not create database. You may need to:
        echo 1. Create database manually
        echo 2. Check PostgreSQL installation
        echo 3. Verify credentials
    ) else (
        echo [OK] Database %DB_NAME% created
    )
    
    echo.
    echo Creating .env file...
    echo # Database Configuration > .env
    echo DATABASE_URL="postgresql://%DB_USER%:%DB_PASSWORD%@localhost:5432/%DB_NAME%" >> .env
    echo. >> .env
    echo # Session Secret (change this for production) >> .env
    echo SESSION_SECRET="%random%%random%%random%" >> .env
    echo. >> .env
    echo # Application Settings >> .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    
    echo [OK] Created .env file
    
    echo.
    echo Running database migrations...
    call npm run db:push
    if %errorlevel% neq 0 (
        echo [WARNING] Database migrations failed
        echo Please check your database configuration
    ) else (
        echo [OK] Database migrations completed
    )
) else (
    echo.
    echo Skipping database setup.
    echo.
    echo To run the app, you need to:
    echo 1. Create a database
    echo 2. Create a .env file with DATABASE_URL
    echo 3. Run: npm run db:push
)

echo.
echo ========================================
echo Build Options
echo ========================================
echo.

echo Current environment: %NODE_ENV%
if "%NODE_ENV%"=="" set NODE_ENV=development

set /p BUILD_CHOICE="Choose how to run the application: 
1) Development mode (npm run dev)
2) Production build and start (npm run build ^&^& npm start)
3) Just build (npm run build)
4) Exit

Enter your choice (1-4): "

if "%BUILD_CHOICE%"=="1" (
    echo.
    echo Starting in development mode...
    echo The app will start on http://localhost:5000
    echo.
    call npm run dev
) else if "%BUILD_CHOICE%"=="2" (
    echo.
    echo Building for production...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
    echo.
    echo Starting production server...
    echo The app will start on http://localhost:5000
    echo.
    call npm start
) else if "%BUILD_CHOICE%"=="3" (
    echo.
    echo Building for production...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
    echo.
    echo Build completed! You can start the app with: npm start
) else (
    echo Exiting...
)

pause