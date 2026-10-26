# One-time setup for the LetsEarn mobile audit kit (Windows 10/11).
# Run in PowerShell:  powershell -ExecutionPolicy Bypass -File .\setup.ps1
$ErrorActionPreference = "Stop"

function Ok($m)   { Write-Host "  [ok] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  [!]  $m" -ForegroundColor Yellow }
function Has($c)  { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

if (-not (Has winget)) { throw "winget is required (Microsoft Store > 'App Installer'). Install it and re-run." }

Write-Host "1/5 Git (Claude Code needs Git Bash on Windows)"
if (-not (Has git)) { winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements; Refresh-Path }
Ok (git --version)

Write-Host "2/5 Node.js 20+"
$nodeOk = (Has node) -and ([int]((node -v) -replace '^v(\d+).*', '$1') -ge 20)
if (-not $nodeOk) { winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements; Refresh-Path }
Ok ("node " + (node -v))

Write-Host "3/5 adb (Android platform-tools)"
if (-not (Has adb)) { winget install -e --id Google.PlatformTools --accept-source-agreements --accept-package-agreements; Refresh-Path }
if (-not (Has adb)) { throw "adb not on PATH yet. Close and reopen PowerShell, then re-run this script." }
Ok ((adb version | Select-Object -First 1))

Write-Host "4/5 Claude Code"
if (-not (Has claude)) { npm install -g @anthropic-ai/claude-code; Refresh-Path }
Ok "claude installed"

Write-Host "5/5 Connected device"
adb start-server | Out-Null
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" }
if (-not $devices) {
  Warn "No device found. Plug in your Android phone (Developer options > USB debugging ON) or start an emulator, then run: adb devices"
} elseif ($devices -match "unauthorized") {
  Warn "Phone is connected but unauthorized. Unlock it and tap 'Allow USB debugging', then run: adb devices"
} else {
  Ok ("device ready: " + ($devices | Select-Object -First 1).Split("`t")[0])
}

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  cd `"$PSScriptRoot`"; claude"
Write-Host "  Approve the 'mobile' MCP server when asked, log into LetsEarn on the phone, then type /signup-audit"
