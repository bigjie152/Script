# Cloudflare 部署（staging）

## 前提判定
- 本项目为 Next.js App Router，采用 **单项目部署**：`apps/web` 同时提供页面与 `/api/*` 路由。
- Cloudflare Pages 项目为 `script`，Root directory 指向 `apps/web`。

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
cd apps/web
npm run db:init
```

## 4) 构建 Next-on-Pages
在 `apps/web` 目录执行：
```bash
cd apps/web
npx @cloudflare/next-on-pages@latest
```

## 5) 部署到 Cloudflare Pages（staging）
```bash
npx wrangler pages deploy apps/web/.vercel/output/static \
  --project-name script \
  --branch staging
```

## 6) 配置环境变量（Cloudflare Pages / staging）
在 Pages 项目设置中添加：
- `D1_BINDING=DB`
- `AI_PROVIDER_DERIVE=qwen`
- `AI_PROVIDER_CHECK=deepseek`
- `AI_QWEN_API_KEY=...`
- `AI_QWEN_MODEL=qwen3-max-2026-01-23`
- `AI_QWEN_BASE_URL=...`（如使用兼容模式，可填写供应商提供的兼容地址）
- `AI_DEEPSEEK_API_KEY=...`
- `AI_DEEPSEEK_MODEL=DeepSeek-R1`
- `AI_DEEPSEEK_BASE_URL=...`（可选，默认 DeepSeek 官方地址）
- 其他占位 key（如 `AI_API_KEY`/`AI_MODEL`/`AI_BASE_URL`，作为通用兜底）

## 7) Git 构建配置（推荐）
Cloudflare Pages 控制台中设置：
- Root directory：`apps/web`
- Build command：`npx @cloudflare/next-on-pages@latest`
- Build output directory：`.vercel/output/static`

## 8) 验收清单
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
- `d1-schema.sql` 位于仓库根目录，用于最小可演示的 D1 初始化。
- 单项目部署时，API 与前端同域，必须在 `script` 项目中配置 D1 绑定。
