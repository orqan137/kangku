$ErrorActionPreference = 'Stop'

$sdkPath = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $sdkPath) {
  throw 'ANDROID_HOME is not configured.'
}

$adb = Join-Path $sdkPath 'platform-tools\adb.exe'
$emulator = Join-Path $sdkPath 'emulator\emulator.exe'
$runningEmulator = (& $adb devices) -match '^emulator-\d+\s+device$'

if (-not $runningEmulator) {
  Start-Process -FilePath $emulator -ArgumentList @(
    '-avd',
    'Kangku_API_35',
    '-no-snapshot-load'
  )
}

$deadline = (Get-Date).AddMinutes(3)
do {
  Start-Sleep -Seconds 2
  $bootCompleted = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
} while ($bootCompleted -ne '1' -and (Get-Date) -lt $deadline)

if ($bootCompleted -ne '1') {
  throw 'Kangku_API_35 did not finish booting within three minutes.'
}

& "$PSScriptRoot\connect-android.ps1"
