param(
  [string]$BaseUrl = "https://script-426.pages.dev"
)

$AuthUsername = $env:AUTH_USERNAME
if (-not $AuthUsername) { $AuthUsername = "smoke_user" }
$AuthPassword = $env:AUTH_PASSWORD
if (-not $AuthPassword) { $AuthPassword = "smoke_pass_123" }
$CookieJar = [System.IO.Path]::GetTempFileName()
$CookieJarB = [System.IO.Path]::GetTempFileName()

function Truncate-Body {
  param([string]$Text)
  if ($Text.Length -le 800) { return $Text }
  return $Text.Substring(0, 800) + "...(truncated)"
}

function Invoke-Request {
  param(
    [string]$Title,
    [string]$Method,
    [string]$Url,
    [string]$Body = "",
    [string[]]$ExpectedStatus = @(),
    [string]$Jar = $CookieJar
  )

  Write-Host "== $Title =="
  Write-Host ("URL: {0}" -f $Url)
  if ($Body) { Write-Host ("Body: {0}" -f $Body) }

  if ($Body) {
    $tmp = [System.IO.Path]::GetTempFileName()
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp, $Body, $utf8NoBom)
    $resp = & curl.exe -s -X $Method -H "Content-Type: application/json" `
      -b $Jar -c $Jar `
      -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" `
      --data-binary "@$tmp" $Url
    Remove-Item $tmp -Force
  } else {
    $resp = & curl.exe -s -X $Method `
      -b $Jar -c $Jar `
      -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" `
      $Url
  }

  $status = ($resp | Select-String -Pattern "^HTTP_STATUS:" | ForEach-Object { $_.Line.Replace("HTTP_STATUS:","") }).Trim()
  $timeTotal = ($resp | Select-String -Pattern "^TIME_TOTAL:" | ForEach-Object { $_.Line.Replace("TIME_TOTAL:","") }).Trim()
  $bodyOnly = ($resp | Where-Object { $_ -notmatch "^HTTP_STATUS:" -and $_ -notmatch "^TIME_TOTAL:" }) -join "`n"

  Write-Host ("Status: {0}" -f $status)
  Write-Host ("Time: {0}s" -f $timeTotal)
  Write-Host ("Response: {0}" -f (Truncate-Body $bodyOnly))

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
  -Body $registerBody `
  -ExpectedStatus @("200","201","409") | Out-Null

$loginBody = @{ username = $AuthUsername; password = $AuthPassword } | ConvertTo-Json -Compress
Invoke-Request -Title "auth login" -Method "POST" -Url "$BaseUrl/api/auth/login" `
  -Body $loginBody `
  -ExpectedStatus @("200") | Out-Null

Invoke-Request -Title "health api" -Method "GET" -Url "$BaseUrl/api/health" -ExpectedStatus @("200") | Out-Null

$createBody = '{"name":"Smoke Project","description":"online smoke","content":{"type":"doc","content":[]}}'
$createResp = Invoke-Request -Title "create project" -Method "POST" -Url "$BaseUrl/api/projects" -Body $createBody -ExpectedStatus @("200","201")
$projectId = ""
try {
  $j = $createResp | ConvertFrom-Json
  $projectId = $j.projectId
  if (-not $projectId -and $j.project) { $projectId = $j.project.id }
} catch {
  $projectId = ""
}

if (-not $projectId) {
  Write-Host "FAIL: projectId not found in response"
  exit 1
}
Write-Host ("projectId={0}" -f $projectId)
Write-Host ""

Invoke-Request -Title "get project" -Method "GET" -Url "$BaseUrl/api/projects/$projectId" -ExpectedStatus @("200") | Out-Null

$truthBody = '{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Truth draft v0.1"}]}]}}'
Invoke-Request -Title "update truth" -Method "PUT" -Url "$BaseUrl/api/projects/$projectId/truth" -Body $truthBody -ExpectedStatus @("200") | Out-Null

Invoke-Request -Title "list issues" -Method "GET" -Url "$BaseUrl/api/projects/$projectId/issues" -ExpectedStatus @("200") | Out-Null

Invoke-Request -Title "publish project" -Method "POST" -Url "$BaseUrl/api/projects/$projectId/publish" -ExpectedStatus @("200","201") | Out-Null

$communityResp = Invoke-Request -Title "community list" -Method "GET" -Url "$BaseUrl/api/community/projects?sort=latest&q=Smoke" -ExpectedStatus @("200")
if (-not ($communityResp -match $projectId)) {
  Write-Host "FAIL: community list does not include project"
  exit 1
}

$AuthUsernameB = "$AuthUsername-2"
$AuthPasswordB = "$AuthPassword-2"
$registerBodyB = @{ username = $AuthUsernameB; password = $AuthPasswordB } | ConvertTo-Json -Compress
Invoke-Request -Title "auth register (B)" -Method "POST" -Url "$BaseUrl/api/auth/register" `
  -Body $registerBodyB -ExpectedStatus @("200","201","409") -Jar $CookieJarB | Out-Null

$loginBodyB = @{ username = $AuthUsernameB; password = $AuthPasswordB } | ConvertTo-Json -Compress
Invoke-Request -Title "auth login (B)" -Method "POST" -Url "$BaseUrl/api/auth/login" `
  -Body $loginBodyB -ExpectedStatus @("200") -Jar $CookieJarB | Out-Null

$ratingBody = '{\"score\":5}'
Invoke-Request -Title "community rating" -Method "PUT" -Url "$BaseUrl/api/community/projects/$projectId/rating" `
  -Body $ratingBody -ExpectedStatus @("200") -Jar $CookieJarB | Out-Null

$commentBody = '{\"content\":\"Suggestion: add character motive\",\"isSuggestion\":true}'
$commentResp = Invoke-Request -Title "community comment" -Method "POST" -Url "$BaseUrl/api/community/projects/$projectId/comments" `
  -Body $commentBody -ExpectedStatus @("201") -Jar $CookieJarB
$commentId = ""
try {
  $c = $commentResp | ConvertFrom-Json
  $commentId = $c.comment.id
} catch {
  $commentId = ""
}
if (-not $commentId) {
  Write-Host "FAIL: commentId missing"
  exit 1
}

Invoke-Request -Title "accept suggestion" -Method "POST" -Url "$BaseUrl/api/community/comments/$commentId/accept" `
  -ExpectedStatus @("200") | Out-Null

$notifyResp = Invoke-Request -Title "notifications (B)" -Method "GET" -Url "$BaseUrl/api/me/notifications" `
  -ExpectedStatus @("200") -Jar $CookieJarB
if (-not ($notifyResp -match "suggestion_accepted")) {
  Write-Host "WARN: notification missing suggestion_accepted"
}

Write-Host "== stability: create + read x20 =="
$success = 0
$fail = 0
$totalTime = 0.0

for ($i = 1; $i -le 20; $i++) {
  Write-Host ("round {0}" -f $i)
  $tmp = [System.IO.Path]::GetTempFileName()
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmp, $createBody, $utf8NoBom)
  $resp = & curl.exe -s -X POST -H "Content-Type: application/json" `
    -b $CookieJar -c $CookieJar `
    -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" `
    --data-binary "@$tmp" "$BaseUrl/api/projects"
  Remove-Item $tmp -Force
  $status = ($resp | Select-String -Pattern "^HTTP_STATUS:" | ForEach-Object { $_.Line.Replace("HTTP_STATUS:","") }).Trim()
  $timeTotal = ($resp | Select-String -Pattern "^TIME_TOTAL:" | ForEach-Object { $_.Line.Replace("TIME_TOTAL:","") }).Trim()
  $bodyOnly = ($resp | Where-Object { $_ -notmatch "^HTTP_STATUS:" -and $_ -notmatch "^TIME_TOTAL:" }) -join "`n"

  if ($status -ne "200" -and $status -ne "201") {
    Write-Host ("FAIL: create project status {0}" -f $status)
    Write-Host ("Response: {0}" -f (Truncate-Body $bodyOnly))
    $fail++
    break
  }

  $roundProjectId = ""
  try {
    $j = $bodyOnly | ConvertFrom-Json
    $roundProjectId = $j.projectId
    if (-not $roundProjectId -and $j.project) { $roundProjectId = $j.project.id }
  } catch {
    $roundProjectId = ""
  }
  if (-not $roundProjectId) {
    Write-Host ("FAIL: projectId missing in round {0}" -f $i)
    $fail++
    break
  }

  $readResp = & curl.exe -s -X GET -b $CookieJar -c $CookieJar -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" "$BaseUrl/api/projects/$roundProjectId"
  $readStatus = ($readResp | Select-String -Pattern "^HTTP_STATUS:" | ForEach-Object { $_.Line.Replace("HTTP_STATUS:","") }).Trim()
  $readTime = ($readResp | Select-String -Pattern "^TIME_TOTAL:" | ForEach-Object { $_.Line.Replace("TIME_TOTAL:","") }).Trim()
  if ($readStatus -ne "200") {
    Write-Host ("FAIL: read project status {0}" -f $readStatus)
    $readBody = ($readResp | Where-Object { $_ -notmatch "^HTTP_STATUS:" -and $_ -notmatch "^TIME_TOTAL:" }) -join "`n"
    Write-Host ("Response: {0}" -f (Truncate-Body $readBody))
    $fail++
    break
  }

  $success++
  $totalTime += ([double]$timeTotal + [double]$readTime)
}

Write-Host ("stability_success={0}" -f $success)
Write-Host ("stability_fail={0}" -f $fail)
Write-Host ("stability_total_time={0}s" -f $totalTime.ToString("F3"))

Remove-Item $CookieJar -Force
Remove-Item $CookieJarB -Force
