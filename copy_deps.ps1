Copy-Item "node_modules\preact\dist\preact.module.js" "lib\preact.module.js" -Force
Copy-Item "node_modules\preact\hooks\dist\hooks.module.js" "lib\hooks.module.js" -Force
Copy-Item "node_modules\htm\dist\htm.module.js" "lib\htm.module.js" -Force
Copy-Item "node_modules\dexie\dist\dexie.min.js" "lib\dexie.min.js" -Force

$hooksContent = Get-Content "lib\hooks.module.js" -Raw
$hooksContent = $hooksContent -replace "from\s*['""]preact['""]", "from './preact.module.js'"
Set-Content "lib\hooks.module.js" $hooksContent

New-Item -ItemType Directory -Path "www\lib" -Force | Out-Null
Copy-Item "lib\*" "www\lib\" -Force
Write-Host "Local libraries bundled successfully!"
