# Skyline Project - Windows 10 Setup Script (PowerShell)
# Run this in PowerShell as Administrator for best results

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Skyline Project - Windows 10 Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "1. Node.js: $nodeVersion [OK]" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/n)"
    if ($response -ne "y") { exit 1 }
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "2. npm: $npmVersion [OK]" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm is not available" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "3. PostgreSQL: Found [OK]" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] PostgreSQL is not installed or not in PATH" -ForegroundColor Yellow
    Write-Host "Please install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "You can continue, but database features won't work until PostgreSQL is installed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up project..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Setup" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dbSetup = Read-Host "Do you want to set up the database now? (y/n)"
if ($dbSetup -eq "y") {
    Write-Host ""
    Write-Host "Setting up database..." -ForegroundColor Yellow
    
    $dbName = Read-Host "Enter database name (default: skyline)"
    if ($dbName -eq "") { $dbName = "skyline" }
    
    $dbUser = Read-Host "Enter database user (default: postgres)"
    if ($dbUser -eq "") { $dbUser = "postgres" }
    
    $dbPassword = Read-Host "Enter database password for $dbUser" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
    
    Write-Host ""
    Write-Host "Creating database $dbName..." -ForegroundColor Yellow
    
    # Try to create database
    try {
        $createdbResult = & createdb -U $dbUser $dbName 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database $dbName created successfully" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Could not create database. Error: $createdbResult" -ForegroundColor Yellow
            Write-Host "You may need to:" -ForegroundColor Yellow
            Write-Host "1. Create database manually" -ForegroundColor Gray
            Write-Host "2. Check PostgreSQL installation" -ForegroundColor Gray
            Write-Host "3. Verify credentials" -ForegroundColor Gray
        }
    } catch {
        Write-Host "[WARNING] Could not create database. Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    # Generate a random session secret
    $sessionSecret = -join ((1..32) | ForEach-Object { ([char[]]([char[]]([char]48..[char]57) + [char[]]([char]65..[char]90) + [char[]]([char]97..[char]122)) | Get-Random) })
    
    # Create .env file
    $envContent = @"
# Database Configuration
DATABASE_URL="postgresql://$dbUser`:$dbPasswordPlain@localhost:5432/$dbName"

# Session Secret (change this for production)
SESSION_SECRET="$sessionSecret"

# Application Settings
NODE_ENV=production
PORT=5000
"@
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "Created .env file" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    try {
        npm run db:push
        Write-Host "Database migrations completed" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Database migrations failed" -ForegroundColor Yellow
        Write-Host "Please check your database configuration" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "Skipping database setup." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run the app, you need to:" -ForegroundColor Yellow
    Write-Host "1. Create a database" -ForegroundColor Gray
    Write-Host "2. Create a .env file with DATABASE_URL" -ForegroundColor Gray
    Write-Host "3. Run: npm run db:push" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Options" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$buildChoice = Read-Host @"
Choose how to run the application:
1) Development mode (npm run dev)
2) Production build and start (npm run build && npm start)
3) Just build (npm run build)
4) Exit

Enter your choice (1-4)
"@

switch ($buildChoice) {
    "1" {
        Write-Host ""
        Write-Host "Starting in development mode..." -ForegroundColor Yellow
        Write-Host "The app will start on http://localhost:5000" -ForegroundColor Green
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Host ""
        Write-Host "Building for production..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Starting production server..." -ForegroundColor Yellow
            Write-Host "The app will start on http://localhost:5000" -ForegroundColor Green
            Write-Host ""
            npm start
        } else {
            Write-Host "[ERROR] Build failed" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Building for production..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Build completed! You can start the app with: npm start" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Build failed" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "Exiting..." -ForegroundColor Gray
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")