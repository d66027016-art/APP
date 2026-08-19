$files = @("app.js", "components.js", "views\dashboard.js", "views\person-details.js", "views\add-loan.js", "views\reports.js", "views\settings.js")

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        if ($file -eq "app.js") {
            $content = $content -replace "https://esm.sh/preact/hooks", "./lib/hooks.module.js"
            $content = $content -replace "https://esm.sh/preact", "./lib/preact.module.js"
            $content = $content -replace "https://esm.sh/htm", "./lib/htm.module.js"
        } else {
            $content = $content -replace "https://esm.sh/preact/hooks", "../lib/hooks.module.js"
            $content = $content -replace "https://esm.sh/preact", "../lib/preact.module.js"
            $content = $content -replace "https://esm.sh/htm", "../lib/htm.module.js"
        }
        
        Set-Content $file $content
        Write-Host "Updated imports in $file"
    }
}
