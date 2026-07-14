$ErrorActionPreference = "Stop"

$values = @{}
foreach ($line in Get-Content -LiteralPath ".env.local" -Encoding UTF8) {
  if ($line -match '^([^#=]+)=(.*)$') {
    $values[$matches[1].Trim()] = $matches[2].Trim().Trim('"')
  }
}

$url = $values["NEXT_PUBLIC_SUPABASE_URL"].TrimEnd("/")
$key = $values["SUPABASE_SECRET_KEY"]
if (-not $key) { $key = $values["SUPABASE_SERVICE_ROLE_KEY"] }
if (-not $url -or -not $key) { throw "Configuration Supabase serveur manquante." }

$headers = @{
  apikey = $key
  Authorization = "Bearer $key"
  "Content-Type" = "application/json"
  Prefer = "return=representation,resolution=merge-duplicates"
  "User-Agent" = "supabase-js-node/2.109.0"
}

$pattern = "^\s*\('([^']+)', '([^']*)', '([^']*)', '([^']+)', (\d+), '([^']+)', (\d+), '([^']+)', '([^']*)', '([^']+)', '([^']+)'\)[,;]"
$seeds = @()
foreach ($migration in @("supabase/migrations/20260714280000_v1_achievement_badge_catalog.sql", "supabase/migrations/20260714300000_progressive_quests_and_points.sql")) {
  foreach ($line in Get-Content -LiteralPath $migration -Encoding UTF8) {
    if ($line -match $pattern) {
      $seeds += [pscustomobject]@{
        code = $matches[1]; name = $matches[2]; description = $matches[3]
        metric = $matches[4]; target = [int]$matches[5]; icon = $matches[6]
        points = [int]$matches[7]; rarity = $matches[8]; reward_name = $matches[9]
        reward_icon = $matches[10]; category = $matches[11]
      }
    }
  }
}
if ($seeds.Count -ne 50) { throw "Catalogue incomplet : $($seeds.Count) lignes détectées." }

$achievementRows = @($seeds | ForEach-Object {
  @{
    code = $_.code; name = $_.name; description = $_.description
    condition_type = "custom"; condition_value = $_.target
    condition_metadata = @{ rule = @{ metric = $_.metric; operator = "gte"; value = $_.target } }
    icon = $_.icon; badge_label = $_.reward_name; points_reward = $_.points
    is_active = $true; is_secret = $false
  }
})
Invoke-RestMethod -Uri "$url/rest/v1/achievements?on_conflict=code" -Headers $headers -Method Post -Body ([Text.Encoding]::UTF8.GetBytes(($achievementRows | ConvertTo-Json -Depth 8))) | Out-Null

$badgeRows = @($seeds | ForEach-Object {
  @{
    code = "reward_$($_.code)"; name = $_.reward_name
    description = $_.description
    icon = $_.reward_icon; rarity = $_.rarity; category = $_.category; is_active = $true
  }
})
Invoke-RestMethod -Uri "$url/rest/v1/badges?on_conflict=code" -Headers $headers -Method Post -Body ([Text.Encoding]::UTF8.GetBytes(($badgeRows | ConvertTo-Json -Depth 5))) | Out-Null

$achievements = Invoke-RestMethod -Uri "$url/rest/v1/achievements?select=id,code" -Headers $headers -Method Get
$badges = Invoke-RestMethod -Uri "$url/rest/v1/badges?select=id,code" -Headers $headers -Method Get
$rarities = Invoke-RestMethod -Uri "$url/rest/v1/rarities?select=id,code" -Headers $headers -Method Get
$rarityLinks = @()
$badgeLinks = @()
foreach ($seed in $seeds) {
  $achievement = $achievements | Where-Object code -eq $seed.code | Select-Object -First 1
  $badge = $badges | Where-Object code -eq "reward_$($seed.code)" | Select-Object -First 1
  $rarity = $rarities | Where-Object code -eq $seed.rarity | Select-Object -First 1
  if ($achievement -and $rarity) { $rarityLinks += @{ achievement_id = $achievement.id; rarity_id = $rarity.id } }
  if ($achievement -and $badge) { $badgeLinks += @{ achievement_id = $achievement.id; badge_id = $badge.id } }
}

Invoke-RestMethod -Uri "$url/rest/v1/achievement_rarities?on_conflict=achievement_id,rarity_id" -Headers $headers -Method Post -Body ([Text.Encoding]::UTF8.GetBytes(($rarityLinks | ConvertTo-Json))) | Out-Null
Invoke-RestMethod -Uri "$url/rest/v1/achievement_badges?on_conflict=achievement_id,badge_id" -Headers $headers -Method Post -Body ([Text.Encoding]::UTF8.GetBytes(($badgeLinks | ConvertTo-Json))) | Out-Null

# Remove the two provisional legacy rows superseded by the complete V1 catalog.
Invoke-RestMethod -Uri "$url/rest/v1/achievements?code=eq.champion_debutant" -Headers $headers -Method Delete | Out-Null
Invoke-RestMethod -Uri "$url/rest/v1/badges?code=eq.guerrier_confirme" -Headers $headers -Method Delete | Out-Null

$countHeaders = @{ apikey = $key; Authorization = "Bearer $key"; Prefer = "count=exact"; "User-Agent" = "supabase-js-node/2.109.0" }
$counts = @{}
foreach ($table in @("achievements", "badges", "achievement_badges")) {
  $response = Invoke-WebRequest -Uri "$url/rest/v1/${table}?select=*" -Headers $countHeaders -Method Get
  $counts[$table] = $response.Headers["Content-Range"] -replace '^.*/', ''
}
[pscustomobject]@{ achievements = $counts.achievements; badges = $counts.badges; links = $counts.achievement_badges }
