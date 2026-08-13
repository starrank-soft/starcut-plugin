param(
  [string]$MarketplacePath = (Split-Path -Parent $PSScriptRoot),
  [string]$McpUrl = 'https://api.starcut.io/mcp'
)

$ErrorActionPreference = 'Stop'
$OAuthScript = Join-Path $PSScriptRoot 'scripts\mcp-manual-oauth.mjs'

Write-Host "Adding marketplace from $MarketplacePath ..."
codebuddy plugin marketplace add $MarketplacePath
if ($LASTEXITCODE -ne 0) {
  throw "codebuddy plugin marketplace add failed with exit code $LASTEXITCODE"
}

Write-Host 'Installing starcut@starcut plugin for local skills ...'
codebuddy plugin install starcut@starcut
if ($LASTEXITCODE -ne 0) {
  throw "codebuddy plugin install failed with exit code $LASTEXITCODE"
}

Write-Host 'Running OAuth helper (foreground; wait for WROTE_MCP_CONFIG=)...'
& node $OAuthScript --host workbuddy --mcp-url $McpUrl --write-config
if ($LASTEXITCODE -ne 0) {
  throw "OAuth helper failed with exit code $LASTEXITCODE. Rerun this script or paste AUTHORIZE_URL from the helper output."
}

Write-Host 'StarCut WorkBuddy install complete. Start a new WorkBuddy session.'
