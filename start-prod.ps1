# Production Startup Script
# Run this script to start the application in production mode

Write-Host "Starting Video Platform in Production Mode..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host ".env file not found. Creating from template..." -ForegroundColor Yellow
    @"
# Database Configuration
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=video_platform
MYSQL_USER=video_user
MYSQL_PASSWORD=video_password

# Backend Configuration
NODE_ENV=production
PORT=3030

# Redis Configuration
REDIS_URL=redis://redis:6379
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host ".env file created. Please update the passwords!" -ForegroundColor Yellow
}

# Build frontend for production
Write-Host "Building frontend for production..." -ForegroundColor Cyan
npm run build

# Start Docker Compose
Write-Host "Starting Docker Compose..." -ForegroundColor Cyan
docker-compose -f docker/docker-compose.prod.yml up -d

Write-Host "Video Platform is now running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3030" -ForegroundColor Cyan
Write-Host "Database: localhost:3366" -ForegroundColor Cyan
Write-Host "Redis: localhost:6379" -ForegroundColor Cyan
