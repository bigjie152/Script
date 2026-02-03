# curl smoke tests

These scripts exercise the V0.1 backend flow:
Project -> Truth (draft) -> Lock -> Derive (role) -> Consistency Check -> Issues.

## Bash
```bash
BASE_URL=http://localhost:3001/api ./run.sh
```

## PowerShell
```powershell
$env:BASE_URL="http://localhost:3001/api"
.\run.ps1
```
