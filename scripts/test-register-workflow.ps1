$ErrorActionPreference = "Stop"
$testEmail = "csc-register-workflow@tests.invalid"
$cycles = if ($env:REGISTER_TEST_CYCLES) { [int]$env:REGISTER_TEST_CYCLES } else { 10 }
$environment = @{}

Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\.env.local") |
  Where-Object { $_ -match "^[A-Z0-9_]+=" } |
  ForEach-Object {
    $separator = $_.IndexOf("=")
    $environment[$_.Substring(0, $separator)] = $_.Substring($separator + 1)
  }

$baseUrl = ([uri]$environment.NEXT_PUBLIC_SUPABASE_URL).GetLeftPart("Authority")
$secret = $environment.SUPABASE_SECRET_KEY
$headers = @{
  apikey = $secret
  Authorization = "Bearer $secret"
  "User-Agent" = "supabase-js-node/2.109.0"
  "Content-Type" = "application/json"
}

function Write-Step([int]$Cycle, [string]$Name, [bool]$Result) {
  $status = if ($Result) { "OK" } else { "FAIL" }
  Write-Output "cycle=$Cycle step=$Name result=$status"
  if (-not $Result) { throw "Register workflow failed: cycle $Cycle, step $Name" }
}

function Get-TestUsers {
  $response = Invoke-RestMethod -Uri "$baseUrl/auth/v1/admin/users?page=1&per_page=1000" -Headers $headers
  return @($response.users) | Where-Object { $_.email -eq $testEmail }
}

function Remove-TestUser([string]$UserId) {
  $body = @{ should_soft_delete = $false } | ConvertTo-Json
  Invoke-RestMethod -Method Delete -Uri "$baseUrl/auth/v1/admin/users/$UserId" -Headers $headers -Body $body | Out-Null
}

Get-TestUsers | ForEach-Object { Remove-TestUser $_.id }

try {
  for ($cycle = 1; $cycle -le $cycles; $cycle++) {
    $body = @{
      email = $testEmail
      password = "CSC-Register-Test-A9!"
      email_confirm = $true
      user_metadata = @{ display_name = "Register Workflow $cycle" }
    } | ConvertTo-Json -Depth 4
    $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/v1/admin/users" -Headers $headers -Body $body
    $userId = $created.id
    Write-Step $cycle "auth_created" ([bool]$userId)

    $profile = Invoke-RestMethod -Uri "$baseUrl/rest/v1/profiles?id=eq.$userId&select=id,status" -Headers $headers
    $settings = Invoke-RestMethod -Uri "$baseUrl/rest/v1/user_settings?user_id=eq.$userId&select=user_id" -Headers $headers
    $role = Invoke-RestMethod -Uri "$baseUrl/rest/v1/user_roles?user_id=eq.$userId&role=eq.member&select=role" -Headers $headers
    $notification = Invoke-RestMethod -Uri "$baseUrl/rest/v1/email_outbox?user_id=eq.$userId&template=eq.registration_pending&select=id,sent_at,last_error" -Headers $headers

    Write-Step $cycle "profile_created" ([bool]$profile.id)
    Write-Step $cycle "settings_created" ([bool]$settings.user_id)
    Write-Step $cycle "member_role_created" ($role.role -eq "member")
    Write-Step $cycle "status_pending" ($profile[0].status -eq "pending")
    Write-Step $cycle "notification_queued" ([bool]$notification.id)

    Remove-TestUser $userId
    Start-Sleep -Milliseconds 250
    Write-Step $cycle "deleted" ((Get-TestUsers).Count -eq 0)
    Write-Step $cycle "completed" $true
  }
} finally {
  Get-TestUsers | ForEach-Object { Remove-TestUser $_.id }
}

Write-Output "register_workflow_cycles=$cycles result=OK"
