# 线上验收报告（MVP-0：API 闭环 + 稳定性 + 可观测）

验收时间：2026-01-16 16:02:25 +08:00  
base_url：https://script-426.pages.dev  
commit：31623ffce6cb578d3bc64b6ab496d0cc8f82c241  
部署环境：Cloudflare Pages / Production  
部署 ID：60cd185e-5bc9-47d1-94c4-37e16037d9f6（wrangler list 显示 8 minutes ago）

## 1) API 闭环结果表

| 接口 | 请求（含 body） | 期望 | 实际 | 结论 |
|---|---|---|---|---|
| GET /api/health | 无 | 200 + ok=true | 200，`{"ok":true,"service":"script-api"}` | 通过 |
| GET /health | 无 | 200 + ok=true | 200，`{"ok":true,"service":"script-api"}` | 通过 |
| POST /api/projects | `{"name":"Smoke Project","description":"online smoke","content":{"type":"doc","content":[]}}` + `Content-Type: application/json` | 201/200 + 返回 id | 400，`{"error":{"message":"invalid json"}}` | 失败（阻塞后续） |
| GET /api/projects/:id | 依赖项目 id | 200 | 未执行（因创建失败无 id） | 未验证 |
| PUT /api/projects/:id/truth | `{"content":{...}}` | 200 | 未执行（前置失败） | 未验证 |
| POST /api/projects/:id/truth/lock | 无 | 200 | 未执行（前置失败） | 未验证 |
| POST /api/projects/:id/ai/derive/roles | `{"truthSnapshotId":...}` | 200 | 未执行（前置失败） | 未验证 |
| POST /api/projects/:id/ai/check/consistency | `{"truthSnapshotId":...}` | 200 | 未执行（前置失败） | 未验证 |
| GET /api/projects/:id/issues | `?truthSnapshotId=...` | 200 | 未执行（前置失败） | 未验证 |
| POST /api/projects/:id/community/feedback | `{"content":"...","type":"comment"}` | 200 | 未执行（前置失败） | 未验证 |
| GET /api/projects/:id/community/feedback | 无 | 200 | 未执行（前置失败） | 未验证 |

说明：`POST /api/projects` 在 curl（含 `Content-Type: application/json`）下稳定返回 400 invalid json，因此闭环被阻断。

## 2) 稳定性统计（20 次创建 + 读取）

执行方式：`scripts/verify-online.ps1`（在创建失败处中止）  
结果：
- 计划轮次：20
- 实际完成：0
- 失败次数：1
- 失败原因：`POST /api/projects` 返回 400 invalid json
- 单次耗时（创建请求）：约 0.44s

结论：稳定性测试无法开展，因创建接口在生产环境无法成功。

## 3) 可观测评估

### 可定位点
- 客户端能明确看到 400 + `{"error":{"message":"invalid json"}}`。
- 失败发生在 body 解析阶段（早于 DB 写入）。

### 不可观测点 / 缺口
- 当前无法从客户端判断 `invalid json` 的具体解析异常（缺少服务端错误日志展示或 request-id 回溯）。
- 未抓取到 Pages 函数端日志（需要在控制台或 wrangler tail 查看）。

### 如何获取日志
- 控制台路径：Cloudflare → Pages → script → Functions → Logs
- Wrangler：
  1) `npx wrangler pages deployment list --project-name script`
  2) `npx wrangler pages deployment tail <deployment-id> --project-name script --status error --format pretty --sampling-rate 1 --ip self`

### 建议的下一步改进（不要求立即实现）
- 在 `POST /api/projects` 中记录 JSON 解析异常原因（`request.text()` + JSON.parse 的错误信息）。
- 返回响应携带 `requestId`，便于日志检索与定位。
- 对请求体进行最大长度/空 body 保护，避免误判。

## 4) 当前最关键阻塞项 Top 3

1) **POST /api/projects 返回 invalid json**（即使 Content-Type: application/json），导致闭环无法开始。  
2) **后续链路全部被阻塞**（truth/lock/AI/issue/feedback 无法验证）。  
3) **缺少服务端日志回溯**（无法定位 JSON 解析失败的具体原因）。
