param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('solo-cn', 'solo', 'ide-cn', 'ide')]
  [string]$TraeProduct,
  [string]$Project,
  [string]$McpUrl = 'https://api.starcut.io/mcp'
)

$ErrorActionPreference = 'Stop'
$SourceSkills = Join-Path $PSScriptRoot 'skills'
$OAuthScript = Join-Path $PSScriptRoot 'scripts\mcp-manual-oauth.mjs'

if (-not (Test-Path -LiteralPath $SourceSkills)) {
  throw "Missing skills bundle at $SourceSkills"
}

if ($TraeProduct -eq 'solo-cn') {
  $TargetSkills = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.trae-cn\skills'
} elseif ($TraeProduct -eq 'solo') {
  $TargetSkills = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.trae\skills'
} else {
  if (-not $Project) {
    throw "-Project is required for TRAE IDE product '$TraeProduct'."
  }
  if (-not (Test-Path -LiteralPath $Project)) {
    throw "Project does not exist: $Project"
  }
  $TargetSkills = Join-Path $Project '.agents\skills'
}

Write-Host "Installing StarCut skills into $TargetSkills ..."
New-Item -ItemType Directory -Force -Path $TargetSkills | Out-Null
robocopy $SourceSkills $TargetSkills /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

$BasicsSkill = Join-Path $TargetSkills 'basics\SKILL.md'
if (-not (Test-Path -LiteralPath $BasicsSkill)) {
  throw "Skills install verification failed: $BasicsSkill"
}

Write-Host 'Running OAuth helper (foreground; wait for WROTE_MCP_CONFIG=)...'
& node $OAuthScript --host trae --mcp-url $McpUrl --write-config --trae-product $TraeProduct
if ($LASTEXITCODE -ne 0) {
  throw "OAuth helper failed with exit code $LASTEXITCODE. Rerun this script or paste AUTHORIZE_URL from the helper output."
}

Write-Host 'StarCut TRAE install complete. Start a new Agent conversation.'
