# Ensure www folder exists
if (-not (Test-Path "www")) {
    New-Item -ItemType Directory -Path "www" -Force | Out-Null
}

# Copy root JS, HTML, JSON files to www
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
        Write-Host "Copied $f -> www\$f"
    }
}

# Copy directories to www
Copy-Item -Recurse -Force "views" "www\views"
Copy-Item -Recurse -Force "lib" "www\lib"

Write-Host "www folder synchronized completely!"
