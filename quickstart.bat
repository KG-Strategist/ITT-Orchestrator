@echo off
REM Quick Start Setup Script for ITT-Orchestrator (Windows)
setlocal enabledelayedexpansion

echo.
echo 🚀 ITT-Orchestrator Quick Start Setup
echo ======================================

REM Check prerequisites
echo.
echo 📋 Checking prerequisites...

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ docker is not installed. Please install Docker Desktop for Windows.
    echo    Visit: https://docs.docker.com/desktop/install/windows-install/
    exit /b 1
)
echo ✅ docker found

where docker-compose >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  docker-compose not found (may be included in Docker Desktop)
)
echo ✅ docker or docker-compose available

where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ git is not installed.
    echo    Visit: https://git-scm.com/downloads
    exit /b 1
)
echo ✅ git found

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed.
    echo    Visit: https://nodejs.org/
    exit /b 1
)
echo ✅ Node.js found

where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Rust/Cargo not found (needed for building from source)
    echo    Visit: https://www.rust-lang.org/tools/install
)

echo.
echo 🔧 Setting up environment...

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env from template...
    copy .env.example .env
    echo ✅ .env created (update with your configuration)
) else (
    echo ✅ .env already exists
)

REM Create logs directory
if not exist logs mkdir logs

echo.
echo 📦 Installing dependencies...
call npm install

echo.
echo 🐳 Starting Docker containers...
echo This may take a few minutes on first run...
docker-compose up -d

REM Wait for services to be ready
echo.
echo ⏳ Waiting for services to be ready...
setlocal enabledelayedexpansion
set /a count=0
:wait_loop
set /a count+=1
if !count! gtr 30 (
    echo ❌ Services failed to start. Checking logs...
    docker-compose logs backend
    exit /b 1
)

timeout /t 2 /nobreak >nul

curl -s -f http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ API is ready!
    goto services_ready
)

echo    Attempt !count!/30...
goto wait_loop

:services_ready
echo.
echo ✨ Setup complete! Services are running:
echo.
echo   🌐 Frontend:       http://localhost:3000
echo   📡 API:            http://localhost:3001
echo   📊 API Health:     http://localhost:3001/health
echo   🗄️  MongoDB:        localhost:27017
echo   📈 Neo4j:          http://localhost:7474
echo   💾 Redis:          localhost:6379
echo.
echo 📝 Next steps:
echo.
echo   1. Default login credentials (mock login):
echo      Username: admin
echo      Password: any password
echo.
echo   2. Login and get token:
echo      curl -X POST http://localhost:3001/auth/login ^
echo        -H "Content-Type: application/json" ^
echo        -d "{\"username\":\"admin\",\"password\":\"test\"}"
echo.
echo   3. View API documentation:
echo      See openapi.yml for full API spec
echo.
echo   4. Useful commands:
echo      docker-compose logs -f backend    # Watch logs
echo      docker-compose ps                 # Check services
echo      docker-compose down               # Stop all services
echo.
echo 📖 Documentation:
echo    - Deployment: ./DEPLOYMENT.md
echo    - Architecture: ./ARCHITECTURE.md
echo    - Production Checklist: ./PRODUCTION_CHECKLIST.md
echo.
echo Happy coding! 🎉
