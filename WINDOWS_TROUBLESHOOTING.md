# Windows 10 Production Testing - Troubleshooting Guide

## Quick Setup Summary for Windows 10

### 1. Prerequisites Installation
```powershell
# As Administrator in PowerShell:
# Install Node.js (download from nodejs.org)
# Install PostgreSQL (download from postgresql.org)
# Install Git (optional, for version control)

# Verify installations
node --version
npm --version
psql --version
```

### 2. Database Setup
```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database and user
CREATE DATABASE skyline;
CREATE USER skyline_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE skyline TO skyline_user;
\q
```

### 3. Environment Configuration
Create `.env` file:
```env
DATABASE_URL="postgresql://skyline_user:secure_password_here@localhost:5432/skyline"
SESSION_SECRET="your_random_session_secret_here"
NODE_ENV=production
PORT=5000
```

### 4. Project Setup
```cmd
# In Command Prompt or PowerShell:
npm install
npm run db:push
npm run build
npm start
```

## Common Windows 10 Issues & Solutions

### Issue 1: "node: command not found" or npm not recognized
**Symptoms:**
- `node --version` returns command not found
- `npm --version` returns command not found
- Scripts fail to run

**Solutions:**
1. **Reinstall Node.js with "Add to PATH" option checked**
2. **Manually add Node.js to PATH:**
   - Find Node.js installation directory (usually `C:\Program Files\nodejs\`)
   - Add to System PATH environment variable
   - Restart Command Prompt/PowerShell
3. **Use Node.js versions that match your project requirements**

### Issue 2: PostgreSQL Connection Issues
**Symptoms:**
- `psql: could not connect to server`
- "Connection refused" errors
- Database migration failures

**Solutions:**
1. **Check if PostgreSQL service is running:**
   ```cmd
   # In PowerShell as Administrator:
   Get-Service postgresql*
   Start-Service postgresql-x64-14  # Replace with your version
   ```

2. **Verify PostgreSQL is listening on port 5432:**
   ```cmd
   netstat -an | findstr 5432
   ```

3. **Check pg_hba.conf for authentication settings:**
   - Location: `C:\Program Files\PostgreSQL\[version]\data\pg_hba.conf`
   - Ensure `localhost` connections use `md5` authentication

4. **Test connection manually:**
   ```cmd
   psql -h localhost -U skyline_user -d skyline
   ```

### Issue 3: Port 5000 Already in Use
**Symptoms:**
- "EADDRINUSE: address already in use"
- Server fails to start

**Solutions:**
1. **Find and kill process using port 5000:**
   ```cmd
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

2. **Use a different port:**
   ```cmd
   set PORT=3000
   npm start
   ```

### Issue 4: Build Failures with Native Dependencies
**Symptoms:**
- `node-gyp` errors
- Python not found errors
- Visual Studio Build Tools errors

**Solutions:**
1. **Install Windows Build Tools:**
   ```cmd
   npm install -g windows-build-tools
   ```

2. **Install Python 2.7 or 3.x:**
   - Download from python.org
   - Add to PATH

3. **Use Visual Studio Build Tools:**
   - Download Visual Studio Community (free)
   - Install C++ workload

4. **Try with `--ignore-scripts` flag:**
   ```cmd
   npm install --ignore-scripts
   ```

### Issue 5: Permission Denied Errors
**Symptoms:**
- "EPERM: operation not permitted"
- "EACCES: permission denied"

**Solutions:**
1. **Run Command Prompt/PowerShell as Administrator**
2. **Fix npm permissions:**
   ```cmd
   npm config set prefix "C:\Users\[username]\AppData\Roaming\npm"
   ```

3. **For global installations:**
   ```cmd
   npm install -g [package] --prefix C:\Users\[username]\AppData\Roaming\npm
   ```

### Issue 6: Database Migration Issues
**Symptoms:**
- `drizzle-kit push` fails
- "relation does not exist" errors
- Schema validation failures

**Solutions:**
1. **Check DATABASE_URL format:**
   ```env
   # Correct format:
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

2. **Ensure database exists:**
   ```sql
   -- Connect as postgres user
   psql -U postgres
   \l  -- List databases
   ```

3. **Run migrations with verbose logging:**
   ```cmd
   npm run db:push -- --verbose
   ```

### Issue 7: TypeScript Compilation Errors
**Symptoms:**
- `tsc` command fails
- Type checking errors
- Import/export errors

**Solutions:**
1. **Check TypeScript version compatibility:**
   ```cmd
   npx tsc --version
   ```

2. **Install project dependencies:**
   ```cmd
   npm install
   npx tsc
   ```

3. **Clear TypeScript cache:**
   ```cmd
   rmdir /s node_modules\.cache
   ```

### Issue 8: Client Build Issues
**Symptoms:**
- Vite build fails
- CSS/Tailwind issues
- Asset compilation errors

**Solutions:**
1. **Clear Vite cache:**
   ```cmd
   rmdir /s node_modules\.vite
   npm run build
   ```

2. **Check Tailwind configuration:**
   - Verify `tailwind.config.js` exists
   - Check PostCSS configuration

3. **Force rebuild:**
   ```cmd
   npm run build -- --force
   ```

## Testing Production Setup

### Automated Testing Scripts
```cmd
# Use the provided test scripts
setup-windows.bat          # Full setup automation
test-production.bat       # Production testing
setup-windows.ps1         # PowerShell version
test-production.ps1       # PowerShell testing
```

### Manual Testing Commands
```cmd
# 1. Check server health
curl http://localhost:5000/api/health

# 2. Test API endpoints
curl http://localhost:5000/api/celebrities

# 3. Check build output
dir dist

# 4. Verify database connection
curl http://localhost:5000/api/health | findstr "healthy"

# 5. Test frontend
start http://localhost:5000
```

## Performance Testing on Windows 10

### Basic Load Testing
```cmd
# Install Apache Bench (part of Apache HTTP Server)
# Or use PowerShell's built-in testing

# Simple load test with PowerShell:
for ($i=1; $i -le 100; $i++) {
    Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing | Out-Null
    Write-Progress -Activity "Load Test" -Status "Request $i of 100" -PercentComplete $i
}
```

### Memory and CPU Monitoring
1. **Open Task Manager** (Ctrl+Shift+Esc)
2. **Monitor performance** while running the application
3. **Check for memory leaks** during extended testing
4. **Monitor database connection pool**

### Network Testing
```cmd
# Test response times
Measure-Command { Invoke-WebRequest -Uri "http://localhost:5000/api/health" }

# Check port availability
Test-NetConnection -ComputerName localhost -Port 5000
```

## Production-Like Environment Setup

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
SESSION_SECRET="your-super-secure-secret-key-here"
```

### Security Considerations
1. **Use strong SESSION_SECRET values**
2. **Never commit .env files to version control**
3. **Use environment-specific configurations**
4. **Implement proper CORS settings**
5. **Add rate limiting for API endpoints**

### Logging and Monitoring
1. **Enable production logging levels**
2. **Set up error tracking** (e.g., Sentry)
3. **Monitor application logs**
4. **Set up health checks** (already implemented)

### Database Optimization
1. **Configure connection pooling**
2. **Set up database backups**
3. **Monitor query performance**
4. **Use database indexes appropriately**

## Development vs Production Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Hot Reload | Yes | No |
| Source Maps | Yes | Limited |
| Minification | No | Yes |
| Caching | Minimal | Aggressive |
| Error Details | Full | Limited |
| Logging | Verbose | Structured |

## Quick Reference Commands

```cmd
# Setup
setup-windows.bat          # Automated setup
npm install               # Install dependencies
npm run db:push          # Database migrations
npm run build            # Production build

# Development
npm run dev              # Development server with hot reload

# Production
npm start                # Production server

# Testing
test-production.bat       # Automated testing
curl http://localhost:5000/api/health  # Manual health check

# Troubleshooting
netstat -ano | findstr :5000  # Check port usage
tasklist | findstr node       # Check running Node processes
```

This guide should help you set up and test the Skyline project on Windows 10 in a production-like environment!