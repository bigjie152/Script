param(
  [string]$BaseUrl = "http://localhost:3001"
)

function Invoke-TestRequest {
  param(
    [string]$Title,
    [string]$Method,
    [string]$Url,
    [string]$ContentType,
    [string]$Body
  )

  Write-Host "== $Title =="
  try {
    $resp = Invoke-WebRequest -Method $Method -Uri $Url -ContentType $ContentType -Body $Body
    Write-Host ("HTTP {0}" -f $resp.StatusCode)
    Write-Host $resp.Content
  } catch {
    if ($_.Exception.Response) {
      $status = $_.Exception.Response.StatusCode.value__
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $content = $reader.ReadToEnd()
      Write-Host ("HTTP {0}" -f $status)
      Write-Host $content
    } else {
      Write-Host ("HTTP ERR: {0}" -f $_.Exception.Message)
    }
  }
  Write-Host ""
}

$okBody = @{
  name = "Smoke Project"
  description = "smoke"
  content = @{ type = "doc"; content = @() }
} | ConvertTo-Json -Depth 5

Invoke-TestRequest -Title "ok: json body" -Method "POST" -Url "$BaseUrl/api/projects" -ContentType "application/json" -Body $okBody
Invoke-TestRequest -Title "error: missing name" -Method "POST" -Url "$BaseUrl/api/projects" -ContentType "application/json" -Body '{"description":"missing name"}'
Invoke-TestRequest -Title "error: non-json body" -Method "POST" -Url "$BaseUrl/api/projects" -ContentType "text/plain" -Body "hello"
