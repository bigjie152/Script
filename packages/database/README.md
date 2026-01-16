# packages/database

## 用途/职责
数据库层，提供结构化 Schema、迁移与客户端封装。负责持久化边界，不承载业务规则。

## 包含内容
- schema/：表结构与字段定义（project/truth/role/clue/flow_node/issue/audit_log）
- migrations/：数据库迁移文件
- client.ts：数据库客户端入口（占位）
- index.ts：对外出口（占位）

## 与其它目录的依赖关系
- 允许依赖：`/packages/domain`（实体映射与约束对齐）。
- 被依赖方：`apps/api`、`packages/audit`。
- 禁止依赖：`/packages/ai-orchestrator`、`/apps/web`、`/infra/*`。

## 禁止事项
- 在 schema 中定义业务规则或 AI 流程逻辑。
- 在 migrations 中修改业务规则语义而不更新 Domain。
- 前端直接访问数据库层。

## 常见变更场景
- 新增表：在 `schema/` 新增文件并说明与 Domain 实体的映射。
- 新增迁移：在 `migrations/` 添加文件，记录结构变化与回滚策略。
- 字段调整：同步更新 Domain 与 API 契约说明。

## 命名规范/约定
- schema 文件使用 snake_case（如 `flow_node.ts`）。
- 迁移文件采用 `YYYYMMDDHHmm_description` 格式，描述清晰可追溯。
- 表与字段命名保持 snake_case，避免含义歧义。

## 测试/验证原则
- 迁移需可回滚、可重复执行，变更前后保持数据一致性。
- Schema 变更必须与 Domain 约束对齐。