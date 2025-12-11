# Windows 10 Production Setup Guide

This guide will help you run the Skyline project on Windows 10 in a production-like environment for testing.

## Prerequisites

### 1. Install Required Software

#### Install Node.js (v18 or later)
- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS version for Windows
- Run the installer and follow the setup wizard
- Verify installation:
```cmd
node --version
npm --version
```

#### Install Git
- Download from [git-scm.com](https://git-scm.com/download/win)
- Install with default settings
- Verify installation:
```cmd
git --version
```

#### Install PostgreSQL (Required for Database)
- Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- During installation:
  - Set a password for the postgres user (remember this!)
  - Keep the default port (5432)
  - Accept all default settings
- Verify installation:
```cmd
psql --version
```

### 2. Install Windows Build Tools (if needed)
Some native modules may require compilation. Install:
```cmd
npm install -g windows-build-tools
```

## Database Setup

### 1. Create Database
Open PostgreSQL Command Line:
```cmd
psql -U postgres
```

Create the database:
```sql
CREATE DATABASE skyline;
CREATE USER skyline_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE skyline TO skyline_user;
\q
```

### 2. Configure Database Connection
Create a `.env` file in the project root:
```env
# Database Configuration
DATABASE_URL="postgresql://skyline_user:your_secure_password@localhost:5432/skyline"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-session-key-here"

# Application Settings
NODE_ENV=production
PORT=5000

# Optional: Add other environment variables as needed
```

## Project Setup

### 1. Navigate to Project Directory
Open Command Prompt or PowerShell in your project folder:
```cmd
cd path\to\your\project
```

### 2. Install Dependencies
```cmd
npm install
```

This will install all the dependencies specified in package.json.

### 3. Database Migrations
Run database migrations to set up the schema:
```cmd
npm run db:push
```

## Production Build and Testing

### 1. Build the Application
Create a production build:
```cmd
npm run build
```

This will:
- Build the client-side React application
- Bundle the server-side TypeScript code
- Create optimized assets in the `dist` folder

### 2. Run Database Setup (if needed)
If you need to run any initial database setup:
```cmd
npm run db:seed
```

### 3. Start the Production Server
```cmd
npm start
```

The application will:
- Start on port 5000 (or your configured PORT)
- Serve static files from the built client
- Run the Express backend API
- Connect to your PostgreSQL database

### 4. Test the Application

Open your browser and navigate to:
- **Main Application**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Development vs Production Mode

### Development Mode
```cmd
npm run dev
```
- Hot reload for client changes
- TypeScript compilation on the fly
- Vite dev server with HMR
- No code minification

### Production Mode
```cmd
npm run build && npm start
```
- Pre-compiled and optimized
- Static file serving
- Minified code
- Production database connections

## Testing the Full Stack

### 1. Frontend Testing
- Open http://localhost:5000
- Test routing between pages
- Verify React components load correctly
- Check responsive design

### 2. Backend API Testing
Test key endpoints:
```cmd
# Health check
curl http://localhost:5000/api/health

# Test other endpoints as needed
curl http://localhost:5000/api/your-endpoint
```

### 3. Database Integration
- Test features that require database connectivity
- Verify user registration/login (if applicable)
- Check data persistence

### 4. WebSocket Testing
If your app uses WebSockets:
- Test real-time features
- Verify socket.io connections
- Check notification systems

## Troubleshooting

### Common Issues

#### Port Already in Use
If port 5000 is busy:
```cmd
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

#### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists
- Test connection:
```cmd
psql -h localhost -U skyline_user -d skyline
```

#### Build Issues
Clear node_modules and reinstall:
```cmd
rmdir /s node_modules
del package-lock.json
npm install
```

#### Permission Issues (Windows)
Run Command Prompt as Administrator for:
- Global npm installations
- Database creation
- Port binding below 1024

### Performance Testing
To test production-like performance:

1. **Enable Production Logging**
```cmd
set NODE_ENV=production
```

2. **Monitor Resources**
- Task Manager for CPU/Memory
- Database query performance
- Network response times

3. **Load Testing**
Use tools like:
- Apache Bench (ab)
- Artillery
- LoadRunner

## Production Deployment Considerations

When ready for actual production:

1. **Environment Variables**
   - Use proper secrets management
   - Set up environment-specific configs
   - Use HTTPS certificates

2. **Database**
   - Use managed PostgreSQL service
   - Set up connection pooling
   - Implement backup strategy

3. **Security**
   - Enable CORS properly
   - Use secure session stores
   - Implement rate limiting
   - Add input validation

4. **Monitoring**
   - Set up logging
   - Implement health checks
   - Add error tracking
   - Monitor performance metrics

## Quick Start Summary

```cmd
# 1. Install prerequisites (Node.js, Git, PostgreSQL)
# 2. Create database and user
# 3. Create .env file with database URL
# 4. Install dependencies
npm install

# 5. Run migrations
npm run db:push

# 6. Build for production
npm run build

# 7. Start the application
npm start

# 8. Open browser to http://localhost:5000
```

This setup gives you a production-like environment on Windows 10 for comprehensive testing!