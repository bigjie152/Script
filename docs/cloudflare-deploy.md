# Cloudflare 部署（staging）

## 目标
- 使用 Cloudflare Pages 部署 `apps/api`（Next.js App Router）
- 数据库使用 Cloudflare D1
- AI 使用 mock（`AI_PROVIDER=mock`）

## 前置条件
- 已拥有 Cloudflare 账号与 Pages/D1 权限
- 已安装 Node.js（本地构建）
- 通过 `npx wrangler` 使用 Wrangler CLI

## 1) 创建 D1 数据库
```bash
npx wrangler d1 create script-staging
```
创建后会返回 `database_id`，请填入 `infra/cloudflare/wrangler.toml`。

## 2) 配置 wrangler.toml
`infra/cloudflare/wrangler.toml` 已提供模板：
- `name = "script"`
- `[[d1_databases]] binding = "DB"`（对应 `D1_BINDING=DB`）
- `AI_PROVIDER = "mock"`

请将 `database_id` 替换为步骤 1 中返回的值。

## 3) 初始化 D1 Schema
使用现成的 SQL 文件初始化 D1：
```bash
npx wrangler d1 execute script-staging --file apps/api/scripts/d1-schema.sql
```
如需在预览环境使用远程数据库，可加 `--remote`；如需本地 D1 测试，可加 `--local`。

## 4) 构建 Next 应用（apps/api）
在仓库根目录执行：
```bash
npx @cloudflare/next-on-pages@latest --cwd apps/api
```
构建产物会输出到 `apps/api/.vercel/output`。

## 5) 部署到 Cloudflare Pages（staging）
```bash
npx wrangler pages deploy apps/api/.vercel/output/static \
  --project-name script \
  --branch staging \
  --config infra/cloudflare/wrangler.toml
```

## 6) 环境变量设置
在 Cloudflare Pages 项目中配置（建议在 Preview/Branch 环境）：
- `AI_PROVIDER=mock`
- `D1_BINDING=DB`
- `AI_API_KEY`（可留空）

> 本地开发使用 `.env` 与 `D1_DB_PATH`；Cloudflare 运行时只使用 D1 绑定。

## 7) 验证清单（API）
- `POST /api/projects` 创建项目
- `PUT /api/projects/:id/truth` 保存 Truth 草稿
- `POST /api/projects/:id/truth/lock` 生成 snapshot
- `POST /api/projects/:id/ai/derive/roles` 派生角色（mock）
- `POST /api/projects/:id/ai/check/consistency` 一致性检查（mock）
- `GET /api/projects/:id/issues` 查询 issues

> 当前阶段仅保证后端接口可演示；前端页面待接入后再补充访问路径。
