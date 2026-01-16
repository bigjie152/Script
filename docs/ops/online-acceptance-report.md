# 线上验收报告（Milestone 0 基线）

验收时间：2026-01-17 05:22 +08:00  
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
**结果**
- 请求头含 `x-request-id`
- 响应体含 `requestId`
- 服务端日志输出 requestId/route/status/latencyMs/error（如有）

**示例**
- header：`x-request-id: 02f18757-d29b-4657-9971-252df737c6b7`
- body：`{"requestId":"02f18757-d29b-4657-9971-252df737c6b7", ...}`

## 5) 结论
- 基线 API 闭环已稳定，回归 20/20 通过
- requestId 可观测性已生效
