$pages = Get-ChildItem -Path "src\pages" -Recurse -Filter "*.jsx" | Where-Object {
    $_.FullName -notlike "*\components\*" -and
    $_.FullName -notlike "*\modals\*" -and
    $_.FullName -notlike "*\sections\*" -and
    $_.FullName -notlike "*\tabs\*"
}

foreach ($f in $pages) {
    $content = Get-Content $f.FullName -Raw
    $hasBanner = $content -match "PageContextBanner"
    $rel = $f.FullName.Replace("c:\Users\SANJAY GUPTA\Desktop\BMS-ALL\CUSTOMIZE_FRONTEND\src\pages\", "")
    Write-Host "$rel => HAS_BANNER=$hasBanner"
}
