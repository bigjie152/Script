# apps/api

## 用途
后端 API 服务（Next.js App Router），负责对外提供 V0.1 闭环所需的 HTTP 接口。

## 本地启动
1. 进入目录：`cd apps/api`
2. 安装依赖：`npm install`
3. 配置环境：复制根目录 `.env.example` 为 `.env` 并填写 `D1_DB_PATH`（本地 SQLite 路径，可选 `D1_BINDING`）与 AI 相关配置
4. 初始化数据库：`npm run db:init`
5. 启动服务：`npm run dev`（默认端口 3001）

## V0.1 闭环接口
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id/truth`
- `POST /api/projects/:id/truth/lock`
- `POST /api/projects/:id/ai/derive`（actionType=role）
- `POST /api/projects/:id/ai/check/consistency`
- `GET /api/projects/:id/issues`
- `POST /api/projects/:id/community/feedback`（可选）
- `GET /api/projects/:id/community/feedback`（可选）

## 验证方式
在仓库根目录执行：
- Bash：`./scripts/curl/run.sh`
- PowerShell：`./scripts/curl/run.ps1`
- Node：`node scripts/smoke/run.mjs`

## 依赖关系
- 允许依赖：`/packages/database`、`/packages/ai-orchestrator`、`/packages/prompts`
- 禁止依赖：`/apps/web`（前端）与业务规则落地

## 注意事项
- 仅包含最小闭环实现，不包含权限系统、复杂工作流或事件系统。
- Truth 的状态只支持 `DRAFT` 与 `LOCKED`。
