param(
  [string]$BaseUrl = "https://script-426.pages.dev"
)

$AuthUsername = $env:AUTH_USERNAME
if (-not $AuthUsername) { $AuthUsername = "smoke_user" }
$AuthPassword = $env:AUTH_PASSWORD
if (-not $AuthPassword) { $AuthPassword = "smoke_pass_123" }
$CookieJar = [System.IO.Path]::GetTempFileName()

function Invoke-Request {
  param(
    [string]$Title,
    [string]$Method,
    [string]$Url,
    [string]$Body = "",
    [string[]]$ExpectedStatus = @()
  )

  Write-Host "== $Title =="
  if ($Body) {
    $tmp = [System.IO.Path]::GetTempFileName()
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp, $Body, $utf8NoBom)
    $resp = & curl.exe -s -X $Method -H "Content-Type: application/json" `
      -b $CookieJar -c $CookieJar `
      -w "`nHTTP_STATUS:%{http_code}`n" `
      --data-binary "@$tmp" $Url
    Remove-Item $tmp -Force
  } else {
    $resp = & curl.exe -s -X $Method `
      -b $CookieJar -c $CookieJar `
      -w "`nHTTP_STATUS:%{http_code}`n" `
      $Url
  }

  $status = ($resp | Select-String -Pattern "^HTTP_STATUS:" | ForEach-Object { $_.Line.Replace("HTTP_STATUS:","") }).Trim()
  $bodyOnly = ($resp | Where-Object { $_ -notmatch "^HTTP_STATUS:" }) -join "`n"

  Write-Host ("Status: {0}" -f $status)
  Write-Host ("Response: {0}" -f $bodyOnly)

  if ($ExpectedStatus.Count -gt 0 -and $ExpectedStatus -notcontains $status) {
    Write-Host ("FAIL: expected [{0}], got {1}" -f ($ExpectedStatus -join ", "), $status)
    exit 1
  }

  Write-Host ""
  return $bodyOnly
}

Write-Host ("BASE_URL={0}" -f $BaseUrl)
Write-Host ("AUTH_USERNAME={0}" -f $AuthUsername)
Write-Host ""

$registerBody = @{ username = $AuthUsername; password = $AuthPassword } | ConvertTo-Json -Compress
Invoke-Request -Title "auth register" -Method "POST" -Url "$BaseUrl/api/auth/register" `
  -Body $registerBody -ExpectedStatus @("200","201","409") | Out-Null

$loginBody = @{ username = $AuthUsername; password = $AuthPassword } | ConvertTo-Json -Compress
Invoke-Request -Title "auth login" -Method "POST" -Url "$BaseUrl/api/auth/login" `
  -Body $loginBody -ExpectedStatus @("200") | Out-Null

$createBody = '{"name":"AI Smoke Project","description":"ai real chain","content":{"type":"doc","content":[]}}'
$createResp = Invoke-Request -Title "create project" -Method "POST" -Url "$BaseUrl/api/projects" `
  -Body $createBody -ExpectedStatus @("200","201")
$projectId = ""
try {
  $j = $createResp | ConvertFrom-Json
  $projectId = $j.projectId
  if (-not $projectId -and $j.project) { $projectId = $j.project.id }
} catch {
  $projectId = ""
}

if (-not $projectId) {
  Write-Host "FAIL: projectId not found"
  exit 1
}
Write-Host ("projectId={0}" -f $projectId)
Write-Host ""

$truthBody = '{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Truth for AI verify"}]}]}}'
Invoke-Request -Title "update truth" -Method "PUT" -Url "$BaseUrl/api/projects/$projectId/truth" `
  -Body $truthBody -ExpectedStatus @("200") | Out-Null

Invoke-Request -Title "lock truth" -Method "POST" -Url "$BaseUrl/api/projects/$projectId/truth/lock" `
  -ExpectedStatus @("200") | Out-Null

$deriveBody = '{"actionType":"story","intent":"verify qwen","context":{}}'
$deriveResp = Invoke-Request -Title "ai derive story" -Method "POST" -Url "$BaseUrl/api/projects/$projectId/ai/derive" `
  -Body $deriveBody -ExpectedStatus @("200")

$deriveJson = $deriveResp | ConvertFrom-Json
Write-Host ("derive provider={0} model={1} candidates={2}" -f $deriveJson.provider, $deriveJson.model, ($deriveJson.candidates | Measure-Object).Count)
Write-Host ""

$checkBody = '{}'
$checkResp = Invoke-Request -Title "ai logic check" -Method "POST" -Url "$BaseUrl/api/projects/$projectId/ai/check" `
  -Body $checkBody -ExpectedStatus @("200")
$checkJson = $checkResp | ConvertFrom-Json
Write-Host ("check issues={0}" -f ($checkJson.issues | Measure-Object).Count)

Remove-Item $CookieJar -Force
