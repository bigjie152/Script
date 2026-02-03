# packages/ai-orchestrator

## 用途/职责
AI 编排层（Orchestrator），以“流水线”方式组织 AI 生成与派生流程。每个函数代表一个确定动作，输入/输出均为 Domain 实体或值对象。

## 包含内容
- orchestrator/：生成与派生步骤（deriveCandidates/consistencyCheck/logicCheck）
- adapters/：模型与供应商适配层（base/deepseek）
- types/：流程与适配类型定义
- index.ts：对外出口

## 与其它目录的依赖关系
- 允许依赖：`/packages/domain`、`/packages/prompts`、`/packages/shared`。
- 被依赖方：`apps/api`。
- 禁止依赖：`/packages/database`、`/infra/*`、`/apps/*`。

## 禁止事项
- 在 orchestrator 内编写业务规则或一致性定义（应在 Domain）。
- 在流程中 inline Prompt 文本，必须引用 `packages/prompts`。
- 直接访问数据库或外部存储，输出只面向 Domain。

## 常见变更场景
- 新增流程步骤：在 `orchestrator/` 增加函数，明确输入输出并更新流程说明。
- 接入新模型：在 `adapters/` 新增适配器并保持统一接口。
- 切换 Prompt 版本：更新引用版本并记录变更影响。
- 增加一致性检查：调用 Domain 中的 ConsistencyService，不在本层定义规则。

## 命名规范/约定
- orchestrator 函数以动词开头（generate/derive/lock/check）。
- adapter 文件名以 `.adapter.ts` 结尾，且实现统一接口。
- 类型定义集中在 `types/`，禁止散落到流程文件。

## 测试/验证原则
- 流程需可审计：每步输入/输出可追溯、可复现。
- 适配器需可替换：可使用 mock 验证流程正确性。
