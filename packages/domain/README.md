# packages/domain

## 用途/职责
领域层（Domain），是系统的“宪法”：定义业务实体、规则、约束与一致性。Truth 锁定与一致性约束只能在此定义与维护。

## 包含内容
- entities/：领域实体（Project/Truth/Role/Clue/FlowNode/DMGuide/Issue）
- value-objects/：值对象（TruthSnapshot/Visibility/IssueSeverity）
- services/：领域服务（Script/Truth/Derivation/Consistency/Community）
- policies/：策略与权限规则（Visibility/Edit）
- events/：领域事件
- index.ts：对外聚合出口

## 与其它目录的依赖关系
- 允许依赖：`/packages/shared`（如通用类型），若无必要则保持零依赖。
- 被依赖方：`apps/api`、`packages/ai-orchestrator`、`packages/database`。
- 禁止依赖：`/apps/*`、`/infra/*`、`/packages/prompts`、`/packages/database`（不能反向依赖持久化）。

## 禁止事项
- 在 Domain 中出现 HTTP/UI/数据库/第三方 SDK 代码。
- 将 Prompt 或 AI 输出当作规则来源，规则必须先在 Domain 明确。
- 将一致性检查散落在 apps 或 orchestrator 中。

## 常见变更场景
- 新增实体：在 `entities/` 增加文件，补齐构造/约束与必要的值对象。
- 新增值对象：在 `value-objects/` 定义不可变语义，并更新相关实体引用。
- 新增策略/规则：在 `policies/` 或 `services/` 中新增并声明适用范围。
- 新增事件：在 `events/` 定义领域事件，用于审计或集成通知。
- 新增一致性约束：在 `ConsistencyService` 中集中实现并更新 README 说明。

## 命名规范/约定
- 实体与值对象使用 PascalCase；文件名与类名一致。
- 策略文件以 `Policy` 结尾；服务文件以 `Service` 结尾。
- 事件以 `SomethingHappenedEvent` 或 `SomethingChangedEvent` 命名。

## 测试/验证原则
- 以领域不变量与规则为核心，优先验证边界条件与冲突场景。
- 任何规则变更都必须验证一致性与可追溯性。