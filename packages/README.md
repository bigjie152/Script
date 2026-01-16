# packages

## 用途/职责
核心能力与跨应用复用代码集合。Domain 是宪法，AI 是流水线，Prompt 作为代码资产，Database 管理持久化边界。

## 包含内容
- domain/：领域实体、规则与策略
- ai-orchestrator/：AI 流水线与编排
- prompts/：Prompt 模板与版本库
- database/：Schema、迁移与客户端
- auth/：认证与授权能力边界
- audit/：审计与记录能力边界
- shared/：跨应用共享类型与工具

## 与其它目录的依赖关系
- 允许被 `apps/*` 引用；packages 之间按层级单向依赖。
- `domain` 不依赖上层；`ai-orchestrator` 依赖 `domain` + `prompts`；`database` 依赖 `domain`；`prompts` 无依赖。
- 禁止依赖：packages 不依赖 `apps` 或 `infra`。

## 禁止事项
- 将 UI/HTTP 细节写入 packages。
- 在 packages 内直接引用部署/平台配置。
- 在 prompts 之外定义 Prompt 文本。

## 常见变更场景
- 新增一个包：创建目录、补 README、定义依赖边界与出口。
- 增加共享类型：先在 shared 定义，再被 apps 引用。
- 调整包间依赖：同步更新根 README 的依赖规则与说明。

## 命名规范/约定
- 包目录使用 kebab-case，语义清晰且稳定。
- 每个包必须提供 `README.md` 与 `index.ts` 作为入口说明。
- 重要约束（如 Domain 规则）需在 README 明确声明。

## 测试/验证原则
- 包内部以单元/契约验证为主，跨包交互以集成验证为主。
- 变更需验证不破坏依赖边界与对外契约。