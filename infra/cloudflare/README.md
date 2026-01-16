# infra/cloudflare

## 用途/职责
Cloudflare 平台配置与说明，覆盖 Pages/Workers 的部署边界与环境变量规范，面向 staging/测试环境。

## 包含内容
- `wrangler.toml`：Cloudflare Pages + D1 部署配置（staging）
- `pages.toml`：Pages 配置占位（如需可替换为真实配置）
- `workers.ts`：Workers 入口占位
- `env.example`：Cloudflare 账户/令牌示例变量
- `README.md`：部署边界与维护规范

## 与其它目录的依赖关系
- 允许依赖：`apps/api` 的构建产物与运行时变量
- 禁止依赖：`/packages/*` 或 `apps` 源码细节

## 禁止事项
- 在此目录写入业务逻辑或 Domain 规则
- 在配置中硬编码敏感信息或私有密钥

## 常见变更场景
- 新增环境变量：在 `wrangler.toml` 与 `env.example` 补充键名与用途
- 调整 Pages 配置：记录变更影响范围与回滚策略
- 修改 D1 绑定：同步更新 `D1_BINDING` 与数据库名称

## 命名规范/约定
- 环境变量使用全大写下划线命名
- 绑定名称与代码中的 `D1_BINDING` 保持一致（默认 `DB`）

## 测试/验证原则
- 在 staging 环境验证 API 可读写 D1，确保不改变业务规则与数据流
- 变更后检查 `docs/cloudflare-deploy.md` 是否同步
