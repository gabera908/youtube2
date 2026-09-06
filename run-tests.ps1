# Run all tests and linting for Video Platform
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Video Platform - Test & Lint Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

# 1. Backend Tests
Write-Host "[1/4] Running Backend Tests..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
if (Test-Path "node_modules") {
    npm test 2>&1
} else {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Gray
    npm install 2>&1 | Out-Null
    npm test 2>&1
}
Write-Host ""

# 2. ESLint Check
Write-Host "[2/4] Running ESLint..." -ForegroundColor Yellow
Set-Location $projectRoot
if (Get-Command npx -ErrorAction SilentlyContinue) {
    npx eslint backend/ frontend/js/ desktop/js/ --format stylish 2>&1
} else {
    Write-Host "  npx not found, skipping ESLint" -ForegroundColor Gray
}
Write-Host ""

# 3. Prettier Check
Write-Host "[3/4] Running Prettier Check..." -ForegroundColor Yellow
if (Get-Command npx -ErrorAction SilentlyContinue) {
    npx prettier --check "backend/**/*.js" "frontend/js/**/*.js" "desktop/js/**/*.js" 2>&1
} else {
    Write-Host "  npx not found, skipping Prettier" -ForegroundColor Gray
}
Write-Host ""

# 4. Summary
Write-Host "[4/4] Test Summary" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$backendTests = Get-ChildItem "$projectRoot\backend\__tests__\*.test.js" -ErrorAction SilentlyContinue
$frontendTests = Get-ChildItem "$projectRoot\frontend\__tests__\*.test.js" -ErrorAction SilentlyContinue
$eslintConfigs = Get-ChildItem "$projectRoot" -Recurse -Filter ".eslintrc.json" -ErrorAction SilentlyContinue

Write-Host "  Backend test files:  $($backendTests.Count)" -ForegroundColor Green
Write-Host "  Frontend test files: $($frontendTests.Count)" -ForegroundColor Green
Write-Host "  ESLint configs:      $($eslintConfigs.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $projectRoot
