param(
  [string]$HostIP = "127.0.0.1",
  [int]$Port = 8000
)
$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) | Out-Null
$root = Resolve-Path ".."
Set-Location $root

if (!(Test-Path .venv)) {
  py -3 -m venv .venv
}
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\pip install -r requirements.txt

# .env autofill if missing
if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

$env:HOST = $HostIP
$env:PORT = "$Port"
Write-Host "Starting uvicorn on http://$HostIP:$Port ..."
.\.venv\Scripts\python -m app.main