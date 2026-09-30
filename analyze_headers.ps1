# This script shows the first 5 lines and the return() block header area for each file missing PageContextBanner.

$files = @(
    "AC\ACScheduler.jsx",
    "AC\CassetteAC.jsx",
    "AC\SplitAC.jsx",
    "AlarmSystem\Active.jsx",
    "AlarmSystem\AlarmConfig.jsx",
    "AlarmSystem\MessageTemplateSetting.jsx",
    "EnergyMetering\PDFReport.jsx",
    "EnergyMetering\SolarDashboard.jsx",
    "FirePumps\HeaderPressure.jsx",
    "FirePumps\JockeyMain.jsx",
    "FirePumps\PumpStatus.jsx",
    "LTPanel\BreakerStatus.jsx",
    "LTPanel\IncomingOutgoing.jsx",
    "LTPanel\LTRoom.jsx",
    "LTPanel\LTRoom1.jsx",
    "LTPanel\LTRoom2.jsx",
    "LTPanel\LTRoom3.jsx",
    "VRV\ControlPanel.jsx",
    "VRV\HumanSensor.jsx",
    "VRV\Schedule.jsx",
    "VRV\TempHumidity.jsx",
    "WaterManagement\Overview.jsx",
    "Configuration\Templates.jsx",
    "Admin\AuditLogViewer.jsx",
    "Admin\UserManagement.jsx",
    "Settings\Settings.jsx",
    "Settings\SettingsIndex.jsx",
    "Settings\SiteManagement.jsx",
    "Settings\UserAdministration.jsx",
    "Settings\UserSettings.jsx",
    "Settings\AssetManagement.jsx",
    "Settings\DeviceManagement.jsx",
    "Settings\GlobalSettings.jsx",
    "Settings\ManageOrganisation.jsx",
    "SuperAdmin\SuperAdminConfig.jsx",
    "Help\Feedback.jsx",
    "Help\PolicyCondition.jsx"
)

$base = "src\pages"
foreach ($f in $files) {
    $path = Join-Path $base $f
    if (Test-Path $path) {
        $lines = Get-Content $path
        $total = $lines.Count
        Write-Host "===== $f (${total} lines) ====="
        # Show imports (first 10 lines)
        $importEnd = [Math]::Min(10, $total)
        for ($i = 0; $i -lt $importEnd; $i++) {
            Write-Host "  $($i+1): $($lines[$i])"
        }
        # Find the first "return (" line and show its context (5 lines around it)
        for ($i = 0; $i -lt $total; $i++) {
            if ($lines[$i] -match '^\s*return\s*\(') {
                $start = $i
                $end = [Math]::Min($i + 20, $total - 1)
                Write-Host "  --- return() at line $($i+1) ---"
                for ($j = $start; $j -le $end; $j++) {
                    Write-Host "  $($j+1): $($lines[$j])"
                }
                break
            }
        }
        Write-Host ""
    } else {
        Write-Host "===== $f NOT FOUND ====="
    }
}
