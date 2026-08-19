Add-Type -AssemblyName System.Drawing
$src = "C:\Users\rella\.gemini\antigravity-ide\brain\5985609a-aea8-4085-ae9f-38f0975272b9\app_logo_1787164322663.jpg"
$img = [System.Drawing.Image]::FromFile($src)

function Save-ResizedIcon($targetPath, $w, $h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) { 
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Saved: $targetPath ($w x $h)"
}

Save-ResizedIcon "c:\Users\rella\OneDrive\Desktop\fm\icon.png" 512 512
Save-ResizedIcon "c:\Users\rella\OneDrive\Desktop\fm\www\icon.png" 512 512

$densities = @{
    "mipmap-mdpi" = 48;
    "mipmap-hdpi" = 72;
    "mipmap-xhdpi" = 96;
    "mipmap-xxhdpi" = 144;
    "mipmap-xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
    $size = $densities[$d]
    $baseDir = "c:\Users\rella\OneDrive\Desktop\fm\android\app\src\main\res\$d"
    Save-ResizedIcon "$baseDir\ic_launcher.png" $size $size
    Save-ResizedIcon "$baseDir\ic_launcher_round.png" $size $size
    Save-ResizedIcon "$baseDir\ic_launcher_foreground.png" $size $size
}

$img.Dispose()
Write-Host "All icons generated successfully!"
