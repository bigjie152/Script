$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:3001/api" }

Write-Host "==> Create project"
$project = Invoke-RestMethod -Method Post -Uri "$BaseUrl/projects" -ContentType "application/json" `
  -Body (@{ name = "Demo Project"; description = "V0.1 smoke test" } | ConvertTo-Json)
$projectId = $project.projectId

Write-Host "==> Update truth draft"
$truthBody = @{
  content = @{
    type = "doc"
    content = @(
      @{
        type = "paragraph"
        content = @(@{ type = "text"; text = "Truth draft for V0.1." })
      }
    )
  }
} | ConvertTo-Json -Depth 8
Invoke-RestMethod -Method Put -Uri "$BaseUrl/projects/$projectId/truth" -ContentType "application/json" -Body $truthBody | Out-Null

Write-Host "==> Lock truth"
$lock = Invoke-RestMethod -Method Post -Uri "$BaseUrl/projects/$projectId/truth/lock"
$snapshotId = $lock.truthSnapshotId

Write-Host "==> Consistency check"
$checkBody = @{ truthSnapshotId = $snapshotId } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$BaseUrl/projects/$projectId/ai/check/consistency" -ContentType "application/json" -Body $checkBody | Out-Null

Write-Host "==> Fetch issues"
$issues = Invoke-RestMethod -Method Get -Uri "$BaseUrl/projects/$projectId/issues?truthSnapshotId=$snapshotId"
$issues | ConvertTo-Json -Depth 6

Write-Host "==> Optional feedback"
$feedbackBody = @{ content = "Looks good for V0.1." } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$BaseUrl/projects/$projectId/community/feedback" -ContentType "application/json" -Body $feedbackBody | Out-Null
$feedback = Invoke-RestMethod -Method Get -Uri "$BaseUrl/projects/$projectId/community/feedback"
$feedback | ConvertTo-Json -Depth 6
