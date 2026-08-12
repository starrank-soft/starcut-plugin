param(
  [Parameter(Mandatory = $true)]
  [string]$Project,
  [string]$McpUrl = 'https://api.starcut.io/mcp'
)

$ErrorActionPreference = 'Stop'
$BundleRoot = Split-Path -Parent $PSScriptRoot
$SourceOpenCode = Join-Path $BundleRoot '.opencode'
$SourceConfig = Join-Path $BundleRoot 'opencode.json'
$ProjectOpenCode = Join-Path $Project '.opencode'
$ProjectConfig = Join-Path $Project 'opencode.json'

if (-not (Test-Path -LiteralPath $Project)) {
  throw "PROJECT does not exist: $Project"
}

if (-not (Test-Path -LiteralPath $SourceOpenCode)) {
  throw "Missing skills bundle at $SourceOpenCode"
}

Write-Host "Installing StarCut skills into $ProjectOpenCode ..."
New-Item -ItemType Directory -Force -Path $ProjectOpenCode | Out-Null
robocopy $SourceOpenCode $ProjectOpenCode /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

$BasicsSkill = Join-Path $Project '.opencode\skills\basics\SKILL.md'
if (-not (Test-Path -LiteralPath $BasicsSkill)) {
  throw "Skills install verification failed: $BasicsSkill"
}

Write-Host 'Merging opencode.json mcp.starcut entry ...'
$sourceJson = Get-Content -Raw -LiteralPath $SourceConfig | ConvertFrom-Json
$starcutEntry = $sourceJson.mcp.starcut
$starcutEntry.url = $McpUrl

if (Test-Path -LiteralPath $ProjectConfig) {
  $projectJson = Get-Content -Raw -LiteralPath $ProjectConfig | ConvertFrom-Json
} else {
  $projectJson = [pscustomobject]@{
    '$schema' = 'https://opencode.ai/config.json'
    mcp = [pscustomobject]@{}
  }
}

if (-not $projectJson.mcp) {
  $projectJson | Add-Member -NotePropertyName mcp -NotePropertyValue ([pscustomobject]@{})
}

$projectJson.mcp | Add-Member -NotePropertyName starcut -NotePropertyValue $starcutEntry -Force
$projectJson | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ProjectConfig -Encoding utf8

Push-Location $Project
try {
  Write-Host 'Running opencode mcp auth starcut ...'
  opencode mcp auth starcut
  if ($LASTEXITCODE -ne 0) {
    throw "opencode mcp auth failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

Write-Host 'StarCut OpenCode install complete. Start a new OpenCode session.'
