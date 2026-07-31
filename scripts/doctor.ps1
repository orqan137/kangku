$ErrorActionPreference = 'Stop'

$expectedNodeMajor = 24
$expectedReactVersion = '19.2.3'
$expectedReactNativeVersion = '0.84.0'
$sdkPath = [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
$javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')

function Assert-Equal {
  param(
    [string]$Label,
    [string]$Actual,
    [string]$Expected
  )

  if ($Actual -ne $Expected) {
    throw "$Label mismatch: expected $Expected, found $Actual"
  }

  Write-Host "[OK] $Label = $Actual"
}

$nodeVersion = (& node --version).Trim().TrimStart('v')
$nodeMajor = [int]($nodeVersion.Split('.')[0])
Assert-Equal 'Node major' "$nodeMajor" "$expectedNodeMajor"

$mobilePackage = Get-Content -Raw -LiteralPath "$PSScriptRoot\..\apps\mobile\package.json" | ConvertFrom-Json
$tossPackage = Get-Content -Raw -LiteralPath "$PSScriptRoot\..\apps\toss\package.json" | ConvertFrom-Json

Assert-Equal 'mobile React' $mobilePackage.dependencies.react $expectedReactVersion
Assert-Equal 'mobile React Native' $mobilePackage.dependencies.'react-native' $expectedReactNativeVersion
Assert-Equal 'toss React' $tossPackage.dependencies.react $expectedReactVersion
Assert-Equal 'toss React Native' $tossPackage.dependencies.'react-native' $expectedReactNativeVersion

if ($mobilePackage.dependencies.PSObject.Properties.Name -match '^expo($|-)') {
  throw 'Expo dependencies must not be added to apps/mobile without an explicit compatibility review.'
}

if ($tossPackage.dependencies.PSObject.Properties.Name -match '^expo($|-)') {
  throw 'Expo dependencies are not allowed in apps/toss.'
}

if (-not $javaHome -or -not (Test-Path -LiteralPath "$javaHome\bin\java.exe")) {
  throw 'JAVA_HOME is missing or invalid.'
}
$env:JAVA_HOME = $javaHome
Write-Host "[OK] JAVA_HOME = $javaHome"

if (-not $sdkPath -or -not (Test-Path -LiteralPath "$sdkPath\platform-tools\adb.exe")) {
  throw 'ANDROID_HOME is missing or invalid.'
}
Write-Host "[OK] ANDROID_HOME = $sdkPath"

@(
  'platforms\android-35',
  'platforms\android-36',
  'build-tools\36.0.0',
  'emulator\emulator.exe'
) | ForEach-Object {
  if (-not (Test-Path -LiteralPath (Join-Path $sdkPath $_))) {
    throw "Required Android SDK component is missing: $_"
  }
}
Write-Host '[OK] Android API 35/36, Build Tools 36, and Emulator are installed'

$avdList = & "$sdkPath\cmdline-tools\latest\bin\avdmanager.bat" list avd 2>&1 | Out-String
if ($avdList -notmatch 'Name:\s+Kangku_API_35') {
  throw 'Kangku_API_35 AVD is missing.'
}
Write-Host '[OK] Kangku_API_35 AVD is configured'

$globalPackages = (& npm ls -g --depth=0 2>&1 | Out-String)
if ($globalPackages -match '(^|\s)(expo-cli|react-native-cli)@') {
  throw 'Legacy global expo-cli or react-native-cli is installed. Remove it before continuing.'
}
Write-Host '[OK] No legacy global Expo or React Native CLI'

& "$sdkPath\platform-tools\adb.exe" devices -l
Write-Host '[OK] Kangku development environment is consistent.'
