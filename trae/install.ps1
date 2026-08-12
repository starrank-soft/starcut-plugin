param(
  [Parameter(Mandatory = $true)]
  [string]$Project,
  [string]$McpUrl = 'https://api.starcut.io/mcp'
)

$ErrorActionPreference = 'Stop'
$BundleRoot = Split-Path -Parent $PSScriptRoot
$SourceAgents = Join-Path $BundleRoot '.agents'
$OAuthScript = Join-Path $BundleRoot 'scripts\mcp-manual-oauth.mjs'
$ProjectAgents = Join-Path $Project '.agents'

if (-not (Test-Path -LiteralPath $Project)) {
  throw "PROJECT does not exist: $Project"
}

if (-not (Test-Path -LiteralPath $SourceAgents)) {
  throw "Missing skills bundle at $SourceAgents"
}

Write-Host "Installing StarCut skills into $ProjectAgents ..."
New-Item -ItemType Directory -Force -Path $ProjectAgents | Out-Null
robocopy $SourceAgents $ProjectAgents /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

$BasicsSkill = Join-Path $Project '.agents\skills\basics\SKILL.md'
if (-not (Test-Path -LiteralPath $BasicsSkill)) {
  throw "Skills install verification failed: $BasicsSkill"
}

Write-Host "Running OAuth helper ..."
& node $OAuthScript --host trae --mcp-url $McpUrl --write-config
if ($LASTEXITCODE -ne 0) {
  throw "OAuth helper failed with exit code $LASTEXITCODE"
}

Write-Host "StarCut TRAE install complete. Start a new Agent conversation."
