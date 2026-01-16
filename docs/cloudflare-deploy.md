# Cloudflare 部署（staging）

## 前提判定
- 本项目为 Next.js App Router（位于 `apps/api`），部署形态采用 Cloudflare Pages + `@cloudflare/next-on-pages`。

## 1) 安装/登录 Wrangler
```bash
npx wrangler whoami
# 如未登录：
npx wrangler login
```

## 2) 创建 D1 数据库
```bash
npx wrangler d1 create script-staging
```
将输出的 `database_id` 填入 `infra/cloudflare/wrangler.toml` 的 `database_id`。

## 3) 初始化 D1 Schema（两种方式）
方式 A：直接执行 SQL（推荐用于远程 D1）
```bash
npx wrangler d1 execute script-staging --file=./d1-schema.sql
```

方式 B：使用项目的 db:init（适用于本地 SQLite 演示）
```bash
cd apps/api
npm run db:init
```

## 4) 构建 Next-on-Pages
在仓库根目录执行：
```bash
npx @cloudflare/next-on-pages@latest --cwd apps/api
```

## 5) 部署到 Cloudflare Pages（staging）
```bash
npx wrangler pages deploy apps/api/.vercel/output/static \
  --project-name script \
  --branch staging \
  --config infra/cloudflare/wrangler.toml
```

## 6) 配置环境变量（Cloudflare Pages / staging）
在 Pages 项目设置中添加：
- `AI_PROVIDER=mock`
- `D1_BINDING=DB`
- 其他占位 key（如 `AI_API_KEY=`，请用 Secrets/Vars 配置）

## 7) 验收清单
- 访问 `https://<your-domain>/workspace`
- 访问 `https://<your-domain>/editor`
- 请求 `https://<your-domain>/api/health` 返回 `{ ok: true }`

最小写入验证（示例）：
```bash
curl -X POST "https://<your-domain>/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Staging Demo","description":"D1 write test"}'
```

## 说明
- `wrangler.toml` 放置于 `infra/cloudflare/`，部署时已通过 `--config` 指定。
- `d1-schema.sql` 位于仓库根目录，用于最小可演示的 D1 初始化。
