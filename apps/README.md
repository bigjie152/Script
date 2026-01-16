# apps

## 用途/职责
应用层（App Layer），承载对外的产品入口与接口交付。负责编排 UI 与 HTTP 接口，不承载业务规则；业务规则统一归属 Domain。

## 包含内容
- web/：前端应用（UI/交互/请求封装）
- api/：后端 API 应用（路由/控制器/校验/中间件）

## 与其它目录的依赖关系
- 允许依赖：`/packages/*`（domain/ai-orchestrator/prompts/database/auth/audit/shared）。
- 允许依赖：`/infra` 仅作为部署目标参考（不在运行时代码中引用）。
- 禁止依赖：`/apps/*` 之间相互引用源码；`/packages/*` 反向依赖 `apps`。

## 禁止事项
- 在 `apps` 内实现 Domain 规则、派生逻辑、Prompt 文本或一致性校验。
- 在应用层写数据库结构或迁移定义。
- 在 web 中直接调用 ai-orchestrator 或 database 包。

## 常见变更场景
- 新增一个应用：增加子目录、补全 README、定义入口边界与依赖说明。
- 新增一类接口分组：在 api/app 下增加资源目录，完善 controller/validator 说明。
- 新增 UI 模块：在 web/components 或 features 下新增模块并补充规范。

## 命名规范/约定
- 应用目录用小写英文，短横线分隔（如 `web`、`api`）。
- 应用内路由与资源目录使用小写复数（如 `projects`）。
- README 必须写明边界与依赖约束。

## 测试/验证原则
- 应用层验证以“接口契约正确、UI 行为正确”为主。
- 业务正确性由 Domain 与 Orchestrator 的测试兜底，应用层只做集成验证。