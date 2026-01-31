# script-ai-platform

## 本地开发环境（Cloudflare D1 + AI）
1) 配置环境变量：在根目录 `.env` 中填写 `D1_DB_PATH`（本地 SQLite 路径），可选 `D1_BINDING`（远程绑定名），并设置 AI 路由变量（见 `.env.example`）
2) 安装依赖：`cd apps/api` 然后执行 `npm install`
3) 初始化数据库：`npm run db:init`
4) 启动后端：`npm run dev`（默认 3001 端口）
5) 跑通闭环：在仓库根目录执行 `./scripts/curl/run.sh` 或 `.\scripts\curl\run.ps1` 或 `node scripts/smoke/run.mjs`（或在 `apps/api` 运行 `npm run smoke`）

## 文档与对接
- API 契约：`docs/api.yaml`
- 前端对接清单：`docs/frontend-integration.md`
- Cloudflare 部署：`docs/cloudflare-deploy.md`
- Smoke 脚本：`scripts/smoke/run.mjs`

## Cloudflare Staging 部署
- 配置入口：`docs/cloudflare-deploy.md`
- 关键变量：`D1_BINDING=DB`、`AI_PROVIDER_DERIVE`、`AI_PROVIDER_CHECK`（以及对应的 API Key）

## 1. 项目简介
script-ai-platform 是面向剧本创作与协作的 AI 平台 Monorepo，提供清晰的工程边界与团队协作规范，覆盖应用层、领域层（Domain）、AI 编排（Orchestrator）、Prompt 库、数据库与基础设施文档。

## 2. Monorepo 总览
```
script-ai-platform/
|-- apps/        # Web 与 API 应用层
|-- packages/    # Domain/AI/Prompt/DB/Auth/Audit/Shared
|-- infra/       # 部署与平台配置
|-- docs/        # 需求/架构/规范文档
`-- scripts/     # 运维与辅助脚本
```
该结构以“可维护、可扩展、边界清晰”为目标：apps 负责交付，packages 提供能力与规则，infra 管理平台，docs 与 scripts 支撑协作与运维。

## 3. 核心工程原则
- 前端 ≠ 业务逻辑：`apps/web` 只做 UI/交互/请求封装，不实现规则与一致性校验
- Domain 是宪法：业务规则、实体约束、Truth 锁定与一致性只存在于 `packages/domain`
- AI 是流水线：`packages/ai-orchestrator` 以明确步骤编排，输入输出均为 Domain 实体
- Infra 与业务解耦：infra 只描述部署与平台，不承载业务与规则

## 4. 分层与依赖关系
- 允许依赖：`apps/api` -> `packages/domain` / `packages/ai-orchestrator` / `packages/database` / `packages/auth` / `packages/audit` / `packages/shared`。例：controller 调用 domain service
- 允许依赖：`apps/web` -> `apps/api`（仅 HTTP）/ `packages/shared`。例：UI 通过 API client 获取数据
- 允许依赖：`packages/ai-orchestrator` -> `packages/domain` + `packages/prompts`。例：Orchestrator 使用 Prompt 模板产出 Domain 结果
- 允许依赖：`packages/database` -> `packages/domain`（映射与约束对齐）
- 禁止依赖：`packages/domain` -> 任何 `apps/*` 或 `infra/*`。例：Entity 不得引用 controller
- 禁止依赖：`packages/prompts` -> 任何代码模块；Prompt 仅作为静态资源被引用
- 禁止依赖：`apps/web` -> `apps/api` 源码互引，只能经由 HTTP 契约交互

## 5. 目录导航
- [apps/README.md](./apps/README.md)
- [apps/web/README.md](./apps/web/README.md)
- [apps/api/README.md](./apps/api/README.md)
- [packages/README.md](./packages/README.md)
- [packages/domain/README.md](./packages/domain/README.md)
- [packages/ai-orchestrator/README.md](./packages/ai-orchestrator/README.md)
- [packages/prompts/README.md](./packages/prompts/README.md)
- [packages/database/README.md](./packages/database/README.md)
- [packages/auth/README.md](./packages/auth/README.md)
- [packages/audit/README.md](./packages/audit/README.md)
- [packages/shared/README.md](./packages/shared/README.md)
- [infra/README.md](./infra/README.md)
- [infra/cloudflare/README.md](./infra/cloudflare/README.md)
- [infra/aliyun/README.md](./infra/aliyun/README.md)
- [docs/README.md](./docs/README.md)
- [scripts/README.md](./scripts/README.md)

维护手册入口链接：`/docs/README.md`

## 6. 变更指南
### 加一个实体（Domain Entity）
- 在 `packages/domain/entities/` 新增实体文件，保持职责单一且可验证
- 为实体补齐对应的值对象（Value Object）或策略（Policy）
- 在 `packages/domain/index.ts` 暴露对外入口并更新文档说明
- 检查是否需要新增事件（Event）或一致性约束
- 更新相关 README 的“包含内容/命名规范/禁止事项”

### 加一条派生规则（Derivation Rule）
- 在 `packages/domain/services/` 或 `policies/` 新增规则实现，并说明输入输出
- 规则必须以 Domain 实体为参数，避免依赖外部 IO
- 若与 AI 流程关联，先在 Domain 定义约束，再由 Orchestrator 触发
- 更新 Domain README 的规则清单与变更场景说明

### 加一个 AI pipeline
- 在 `packages/ai-orchestrator/orchestrator/` 新增步骤函数，保持“一个函数 = 一个确定动作”
- 明确输入/输出为 Domain 实体或值对象，避免引入数据库依赖
- 引用 `packages/prompts` 的版本化 Prompt，不允许 inline
- 更新 Orchestrator README 的流程边界与命名规范

### 加一个 prompt 版本
- 在 `packages/prompts/` 对应分类目录新增 `*.vN.md` 文件
- 在 Orchestrator 中明确使用新版本，并保留旧版本可回溯
- 更新 Prompts README 的版本策略与对齐要求
- 若涉及一致性校验，确保 check/ 下规则同步

### 加一个数据库表
- 在 `packages/database/schema/` 新增 schema 文件并说明映射关系
- 在迁移或初始化中加入对应建表语句，命名符合约定
- 确认与 Domain 实体一致性（字段与约束映射）
- 更新 Database README 的表与迁移清单

### 加一个 API 路由
- 在 `apps/api/app/` 新增资源目录，补 controller 与 validator
- controller 仅做编排与权限检查，不写业务规则
- validator 只做参数与格式校验，业务约束交由 Domain
- 更新 apps/api README 的资源与边界说明

### 加一个前端页面
- 在 `apps/web/app/` 新增路由目录，并拆分页面与子模块
- 需要复用的 UI 放入 `components/`，页面级逻辑入 `features/`
- API 调用统一进入 `services/`，类型同步至 `types/`
- 更新 apps/web README 的页面与模块说明

## 7. 文档维护规范
### README 更新触发条件
- 新增/删除目录、移动模块边界、调整依赖方向时必须更新 README
- 改变命名规范、流程步骤、接口契约时必须同步文档
- 对外接口或规则发生变化时，优先更新 Domain/Orchestrator/Prompt 说明

### 版本化策略
- Prompt 与规则说明采用版本号（如 `v1`、`v2`），保留历史记录与变更原因
- README 的重大调整需在 docs 中记录变更摘要与日期

### 命名规范/约定
- 目录与文件名遵循“语义清晰 + 稳定可扩展”的原则，避免缩写歧义
- 资源目录使用小写英文或小写复数，Domain 类名使用 PascalCase

### 禁止事项
- README 与实际目录结构不一致
- 将业务规则写入 apps/ 或 infra/ 的文档示例
- 在文档中使用未版本化的 Prompt 内容

### 测试/验证原则
- 文档应可追溯到对应目录与模块，不依赖脚本执行
- 变更后需检查依赖关系与边界声明是否仍然成立
