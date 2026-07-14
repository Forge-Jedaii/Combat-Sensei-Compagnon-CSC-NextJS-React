$ErrorActionPreference = "Stop"
$testEmail = "csc-register-autoconfirm@tests.invalid"
$testPassword = "CSC-Autoconfirm-Test-A9!"
$environment = @{}

Get-Content -LiteralPath (Join-Path $PSScriptRoot "..\.env.local") |
  Where-Object { $_ -match "^[A-Z0-9_]+=" } |
  ForEach-Object {
    $separator = $_.IndexOf("=")
    $environment[$_.Substring(0, $separator)] = $_.Substring($separator + 1)
  }

$baseUrl = ([uri]$environment.NEXT_PUBLIC_SUPABASE_URL).GetLeftPart("Authority")
$publishableKey = $environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
$secret = $environment.SUPABASE_SECRET_KEY
$userAgent = "supabase-js-node/2.109.0"
$adminHeaders = @{ apikey = $secret; Authorization = "Bearer $secret"; "User-Agent" = $userAgent; "Content-Type" = "application/json" }

function Remove-TestUsers {
  $users = Invoke-RestMethod -Uri "$baseUrl/auth/v1/admin/users?page=1&per_page=1000" -Headers $adminHeaders
  @($users.users) | Where-Object { $_.email -eq $testEmail } | ForEach-Object {
    Invoke-RestMethod -Method Delete -Uri "$baseUrl/auth/v1/admin/users/$($_.id)" -Headers $adminHeaders -Body (@{ should_soft_delete = $false } | ConvertTo-Json) | Out-Null
  }
}

Remove-TestUsers
$userId = $null
try {
  $body = @{
    email = $testEmail
    password = $testPassword
    data = @{ display_name = "Autoconfirm Register Test" }
    gotrue_meta_security = @{}
  } | ConvertTo-Json -Depth 4
  $signup = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/v1/signup" -Headers @{ apikey = $publishableKey; "User-Agent" = $userAgent; "Content-Type" = "application/json" } -Body $body
  $userId = $signup.user.id
  if (-not $userId) { throw "Auth user was not created" }
  if (-not $signup.access_token) { throw "Confirm Email is still enabled: signUp returned no immediate session" }
  if (-not $signup.user.email_confirmed_at) { throw "Email was not implicitly confirmed" }

  $profile = Invoke-RestMethod -Uri "$baseUrl/rest/v1/profiles?id=eq.$userId&select=id,status" -Headers $adminHeaders
  $settings = Invoke-RestMethod -Uri "$baseUrl/rest/v1/user_settings?user_id=eq.$userId&select=user_id" -Headers $adminHeaders
  $role = Invoke-RestMethod -Uri "$baseUrl/rest/v1/user_roles?user_id=eq.$userId&role=eq.member&select=role" -Headers $adminHeaders
  $notification = Invoke-RestMethod -Uri "$baseUrl/rest/v1/email_outbox?user_id=eq.$userId&template=eq.registration_pending&select=id" -Headers $adminHeaders
  if ($profile.status -ne "pending") { throw "Profile status is not pending" }
  if (-not $settings.user_id) { throw "User settings are missing" }
  if ($role.role -ne "member") { throw "Member role is missing" }
  if (-not $notification.id) { throw "Registration notification is missing" }

  Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/v1/logout" -Headers @{ apikey = $publishableKey; Authorization = "Bearer $($signup.access_token)"; "User-Agent" = $userAgent } | Out-Null
  Write-Output "public_signup=OK email_confirmed=OK session_immediate=OK profile_pending=OK settings=OK member=OK notification=OK logout=OK"
} finally {
  Remove-TestUsers
  Write-Output "test_account_deleted=True"
}
