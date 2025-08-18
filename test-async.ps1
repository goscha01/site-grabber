# Test Async Screenshot API
Write-Host "Testing Async Screenshot API..." -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
    Write-Host "Health Check: $($health.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($health.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Queue Stats
Write-Host "`n2. Testing Queue Stats..." -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "http://localhost:5000/api/queue/stats" -Method GET
    Write-Host "Queue Stats: $($stats.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($stats.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Queue Stats Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Async Screenshot
Write-Host "`n3. Testing Async Screenshot..." -ForegroundColor Yellow
$body = @{
    url = "https://example.com"
    options = @{
        fullPage = $true
        captureColors = $true
        captureFonts = $true
    }
} | ConvertTo-Json

try {
    $screenshot = Invoke-WebRequest -Uri "http://localhost:5000/api/screenshot-async" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Async Screenshot: $($screenshot.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($screenshot.Content)" -ForegroundColor Gray
    
    # Parse the response to get job ID
    $response = $screenshot.Content | ConvertFrom-Json
    if ($response.jobId) {
        Write-Host "Job ID: $($response.jobId)" -ForegroundColor Cyan
        Write-Host "Check status at: http://localhost:5000/api/job/$($response.jobId)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Async Screenshot Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTesting Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Check the server console for Redis connection status" -ForegroundColor White
Write-Host "2. If Redis is connected, try the frontend at http://localhost:3000" -ForegroundColor White
Write-Host "3. Switch to Async Mode and test with a URL" -ForegroundColor White
