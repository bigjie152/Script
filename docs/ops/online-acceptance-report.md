# 线上验收报告（Milestone 0 基线）

验收时间：2026-01-17 05:10 +08:00  
base_url：https://script-426.pages.dev  
commit：05780eb  
环境：Cloudflare Pages / Production

## 1) 回归脚本
- scripts/verify-online.ps1
- scripts/verify-online.sh
- 覆盖接口：POST /api/projects、GET /api/projects/:id、PUT /api/projects/:id/truth、GET /api/projects/:id/issues

## 2) API 闭环结果（样例）
| 接口 | 期望 | 实际 | 结论 |
|---|---|---|---|
| POST /api/projects | 201 + 返回 projectId | 201 | 通过 |
| GET /api/projects/:id | 200 + project + truth | 200 | 通过 |
| PUT /api/projects/:id/truth | 200 | 200 | 通过 |
| GET /api/projects/:id/issues | 200 + issues[] | 200（issues=[]） | 通过 |

**示例响应（脱敏）**
- POST /api/projects → `{"projectId":"76d70592-...","truthId":"ecf45742-...","status":"DRAFT"}`
- GET /api/projects/:id → `{"project":{...},"truth":{...},"latestSnapshotId":null}`
- PUT /api/projects/:id/truth → `{"truthId":"ecf45742-...","status":"DRAFT"}`
- GET /api/projects/:id/issues → `{"truthSnapshotId":null,"issues":[]}`

## 3) 稳定性回归（20 次 create + read）
- success：20
- fail：0
- total_time：15.297s

## 4) 可观测性（requestId + 结构化日志）
**预期**
- 每个响应包含 requestId（header 或 body 任一即可）
- 结构化日志包含：requestId、route、status、latencyMs、error（如有）

**本次验证结果**
- 脚本回归通过，但当前生产响应未观测到 requestId（header/body 均未出现）
- 需要等待本次部署版本生效后再次复验 requestId

**复验命令（示例）**
```bash
curl -i -X POST https://script-426.pages.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"RequestId Check","description":"check","content":{"type":"doc","content":[]}}'
```

## 5) 结论
- 基线 API 闭环已稳定，回归 20/20 通过
- requestId 可观测性仍需部署生效后复验
