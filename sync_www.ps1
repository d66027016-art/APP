# Remove old www folder completely to avoid nested directories
if (Test-Path "www") {
    Remove-Item -Path "www" -Recurse -Force | Out-Null
}

# Re-create clean www directories
New-Item -ItemType Directory -Path "www" -Force | Out-Null
New-Item -ItemType Directory -Path "www\lib" -Force | Out-Null
New-Item -ItemType Directory -Path "www\views" -Force | Out-Null

# Copy root app files to www
$rootFiles = @(
    "index.html",
    "app.js",
    "components.js",
    "calculations.js",
    "database.js",
    "pdf-generator.js",
    "notification-service.js",
    "manifest.json",
    "sw.js",
    "icon.png"
)

foreach ($f in $rootFiles) {
    if (Test-Path $f) {
        Copy-Item $f "www\$f" -Force
    }
}

# Copy contents of lib and views cleanly
Copy-Item -Path "lib\*" -Destination "www\lib" -Recurse -Force
Copy-Item -Path "views\*" -Destination "www\views" -Recurse -Force

Write-Host "Clean www directory synchronized successfully!"
