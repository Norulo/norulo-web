# Use the same local SVG/PNG renderer on Windows; no separately drawn logo.
$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "generate-social-card.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
