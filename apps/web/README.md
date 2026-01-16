# apps/web

## 用途/职责
前端应用，仅负责界面、交互、状态编排与对 API 的请求封装；前端不承载业务规则与一致性约束。

## 包含内容
- app/：路由与页面结构
- components/：通用组件
- features/：页面级功能模块
- hooks/：通用 hooks
- services/：API Client 与请求封装
- types/：接口契约类型与共享类型引用
- styles/：样式资源
- utils/：前端工具方法

## 与其它目录的依赖关系
- 允许依赖：`/apps/api` 的 HTTP 接口（仅通过网络协议）。
- 允许依赖：`/packages/shared` 的通用类型或前端可用常量。
- 禁止依赖：`/packages/domain`、`/packages/ai-orchestrator`、`/packages/prompts`、`/packages/database`。

## 禁止事项
- 编写 Domain 规则、派生逻辑、Consistency Check、Prompt 文本或 AI 流程控制。
- 在 `services/` 之外发散调用后端接口。
- 将后端模型/数据库结构直接映射到 UI 状态。

## 常见变更场景
- 新增页面：在 `app/` 新建路由目录，并为页面补充对应 components/features。
- 新增 UI 模块：在 `components/` 或 `features/` 新建模块并描述用途。
- 新增接口调用：在 `services/` 增加 API client，并同步 `types/` 中契约类型。
- 新增共享类型：优先在 `packages/shared` 定义，再在 `types/` 引用。

## 命名规范/约定
- 路由目录采用小写或小写复数（如 `project`、`settings`）。
- 组件目录采用功能语义命名，保持可复用性（如 `editor`、`layout`）。
- `services/` 仅包含 API client 与 DTO 适配，不包含业务规则。

## 测试/验证原则
- 重点验证 UI 行为、交互流程、接口请求与响应映射的正确性。
- UI 校验只做表单层/交互层约束，业务正确性由 Domain/API 保障。