param(
  [string]$BaseUrl = "https://script-426.pages.dev"
)

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
    [string[]]$ExpectedStatus = @()
  )

  Write-Host "== $Title =="
  Write-Host ("URL: {0}" -f $Url)
  if ($Body) { Write-Host ("Body: {0}" -f $Body) }

  if ($Body) {
    $tmp = [System.IO.Path]::GetTempFileName()
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tmp, $Body, $utf8NoBom)
    $resp = & curl.exe -s -X $Method -H "Content-Type: application/json" `
      -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" `
      --data-binary "@$tmp" $Url
    Remove-Item $tmp -Force
  } else {
    $resp = & curl.exe -s -X $Method `
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
Write-Host ""

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

  $readResp = & curl.exe -s -X GET -w "`nHTTP_STATUS:%{http_code}`nTIME_TOTAL:%{time_total}`n" "$BaseUrl/api/projects/$roundProjectId"
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
