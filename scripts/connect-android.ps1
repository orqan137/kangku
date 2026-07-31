$ErrorActionPreference = 'Stop'

$sdkPath = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
if (-not $sdkPath) {
  throw 'ANDROID_HOME is not configured.'
}

$adb = Join-Path $sdkPath 'platform-tools\adb.exe'
$devices = & $adb devices
if (-not ($devices -match '\sdevice$')) {
  throw 'No booted Android emulator or device was found.'
}

& $adb reverse tcp:8081 tcp:8081
& $adb reverse tcp:5173 tcp:5173
& $adb reverse --list
