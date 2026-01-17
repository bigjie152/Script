# Script AI Platform 全链路蓝图（主计划）

> 版本：v2026.01  |  适用范围：产品、研发、测试、运维
> 本文是最高级进度与治理蓝图，所有里程碑、Gate、验收与发布决策以此为唯一依据。

---

## 0. 项目目标与治理原则

### 0.1 一句话目标
面向剧本杀创作的结构化编辑平台：以 Project 为中心，Truth 为唯一事实源，AI 以受控工作流方式介入，社区用于协作与反馈。

### 0.2 不返工原则（硬约束）
- 协议先稳定，再叠功能（EditorDocument/Adapter 为边界）
- 生产闭环不可回退（verify-online + online-acceptance-report）
- AI 只放大已完成的产品能力，不替代基础设施

### 0.3 交付与验收基本规则
- 每个里程碑必须具备：目标、交付内容、Gate、验收方式、产出物。
- Gate 未通过不得进入下一里程碑。
- 验收证据必须写入 `docs/ops/online-acceptance-report.md`（或专项报告）。

---

## 1. 当前进度总览（截至目前）

### 1.1 已完成里程碑
- M0 基线固化：生产 API 闭环稳定（projects/truth/issues）+ 回归脚本与验收报告
- M1 编辑器状态机与路由稳定：/editor/[module] 可用、Workspace→Editor 闭环
- M2 模块可编辑闭环：overview/roles/clues/timeline/dm PUT→GET + D1 schema 已应用
- M3 TipTap/AI 准备期：EditorDocument + DocumentEditor + Adapter + modules.config 配置驱动
- M4 TipTap 全模块接入：全模块 TipTap 内核 + Database-like + Slash + Mention（编辑层）+ 文档更新

> 备注：若 Gate4（≥50 次保存一致性/性能/基线不回退）尚未记录为“已完成”，则 M4 仍处于“进行中/待验收”；若已记录并固化证据，则 M4=已完成。

### 1.2 当前所处阶段
- AI 之前的“产品可用性闭环阶段”即将开始。
- 核心任务：账号/登录、数据归属、Workspace/只读预览、编辑器顶栏与多实体、Overview Meta、实体链接（@/#）。

---

## 2. 里程碑总览（可执行矩阵）

| 阶段 | 里程碑 | 目标摘要 | Gate 关键词 | 验收证据 |
| --- | --- | --- | --- | --- |
| 基线 | M0 | 生产闭环+回归 | 20/20 回归 | online-acceptance-report |
| 编辑器稳定 | M1 | 状态机/路由 | 锁定可逆 | UI 验收记录 |
| 模块闭环 | M2 | 模块 PUT→GET | 5 模块一致 | online-acceptance-report |
| 结构准备 | M3 | Adapter/DocumentEditor | 2 模块复用 | editor-architecture |
| TipTap 接入 | M4 | 全模块 TipTap | ≥50 次保存 | online-acceptance-report |
| 账号体系 | M5 | 注册/登录/会话 | 登录持久化 | auth 验收记录 |
| 归属权限 | M6 | Project 归属 | owner 校验 | 权限验收记录 |
| Workspace | M7 | 列表/搜索/预览 | 列表可用 | UI 验收清单 |
| 编辑器完善 | M8 | 顶栏/多实体 | 多实体闭环 | editor 证据 |
| 社区 | M9 | 评论/评分 | 反馈归属 | 社区验收 |
| AI Mock | M10 | Mock 工作流 | 状态可重试 | AI mock 证据 |
| AI 底座 | M11 | Provider/日志 | 可查询 | AI 基础验收 |
| AI Truth | M12 | 生成真相 | >95% 成功 | 20 次回归 |
| AI 派生 | M13 | 生成角色 | 覆盖策略 | 10 次稳定 |
| AI Issues | M14 | 逻辑审查 | issues 稳定 | 样例回归 |
| 内测 | M15 | 邀请+回滚 | 可观测 | 内测 SOP |

---

## 3. AI 之前的必做里程碑（V0.1 可用产品）

> 顺序确认：账号/登录 → Workspace/我的项目 → 编辑器完善 → 社区 → AI

### Milestone 5 — 账号/登录登出（用户名+密码简化注册）
**目标**：建立最小账号体系，与数据库归属关联。

**交付内容**
- 用户注册：username + password
- 用户登录/登出
- 会话保持（cookie/session/token 方案任选，需 Cloudflare 稳定）
- userId 写入与读取：前端可拿到当前用户信息（至少 userId/username）

**Gate 5**
- 注册/登录/登出可用
- 登录状态刷新后仍有效
- 未登录访问策略明确（禁止创建/保存或进入只读）

**验收方式**
- 生产环境手工流程：注册→登录→刷新→仍登录→登出→刷新→未登录
- 记录到 online-acceptance-report.md（或 auth-acceptance-report.md）

**产出物**
- 新增/修改接口清单（auth 相关）
- 数据表（users/sessions 或等价实现）
- 文档：auth 设计说明与验收记录

---

### Milestone 6 — 账号与数据归属对接（Project 归属 userId）
**目标**：所有 Project/编辑数据归属 userId。

**交付内容**
- Project 增加 owner/userId 归属（新建项目自动绑定当前 userId）
- 读取 Project 时校验权限（非 owner 只读/不可写）
- 所有写接口（truth/modules）校验 owner

**Gate 6**
- 登录用户创建项目 → project.userId=当前 userId
- A 用户看不到 B 的私有项目（至少列表不可见）
- B 不能对 A 的项目执行 PUT

**验收方式**
- 两个账号分别创建项目
- 交叉访问：A 访问 B 项目（禁止写/不可见）
- verify-online 不回退

**产出物**
- 数据模型更新说明
- 权限策略说明
- 验收证据写入报告

---

### Milestone 7 — Workspace/我的项目可用化（列表/排序/搜索/只读预览）
**目标**：工作台可用，支持只读预览。

**交付内容**
- 我的项目列表（按当前 userId）
- 排序：最新/最近编辑（updatedAt）
- 搜索：按标题/简介关键词（紧凑搜索）
- 项目卡片：标题、简介、更新时间、状态、Truth Locked 标识
- 只读预览：进入预览界面（不可编辑），提供“进入编辑器（若是 owner）”入口

**Gate 7**
- 登录后能看到自己的项目列表
- 新建项目后立刻出现在列表
- 搜索/排序可用
- 只读预览可用（非 owner 不可编辑）
- 进入编辑器默认 overview

**验收方式**
- 创建 3 个项目，验证列表/排序/搜索
- 第二账号访问：只读预览生效
- 记录验收截图/响应摘要

**产出物**
- Workspace 信息架构说明
- 列表接口契约
- UI 验收 checklist

---

### Milestone 8 — 编辑器功能完善（顶栏、多实体、Overview Meta、实体关联）
**目标**：AI 前打磨为“专业创作可用”。

**交付内容**
- 顶部功能栏：保存状态、Truth 状态/锁定、更新时间、模块名/面包屑
- 角色/线索多条目：创建/重命名/删除（软删除可）
- 模块内二级导航：条目列表
- Overview 升级为 Project Meta Editor
- / @ # 命令完善 + 实体关联

**Gate 8**
- Role/Clue 多条目闭环稳定
- Overview 元信息可编辑并回读一致
- @/# 引用可用且能定位（最小实现）
- verify-online 不回退

**验收方式**
- 创建 2 个角色 + 2 个线索，插入 Truth/DM 形成引用
- 点击引用能定位或打开对应条目
- 保存 20 次以上无损坏（含跨模块切换）

**产出物**
- 实体引用协议说明（必须）
- 里程碑验收记录

---

### Milestone 9 — 社区中心 V0.1（公开作品浏览 + 评论评分 + 结构化建议）
**目标**：建立作品反馈系统，为 AI 与内测提供数据来源。

**交付内容**
- 项目发布/撤回（public/private）
- 社区列表：最新/热门（评分数/评论数/更新时间加权）
- 紧凑搜索
- 剧本卡片：标题、简介、评分、评论数
- 项目预览页（只读）
- 评论 + 评分
- 结构化建议（剧情/角色/逻辑）
- 版权协议（GitHub式的版权控制）

**Gate 9**
- 只有公开项目出现在社区
- 评论/评分/结构化建议可写可读且绑定 userId
- 作者可查看反馈

**验收方式**
- A 发布作品，B 评论/评分/建议，A 查看
- 搜索/排序可用
- 记录到验收报告

---

## 4. AI 阶段里程碑（在 V0.1 可用产品后启动）

### Milestone 10 — AI 工作流外壳（Mock）
- Truth Core：mock 生成真相写入 Draft
- 锁定 Truth
- 派生生成：mock 生成 roles/clues/timeline/dm
- 逻辑审查：mock 或复用 issues
- running/success/fail 可重试

### Milestone 11 — AI 技术底座（真实 Provider + 日志 + promptVersion）
- provider 抽象
- key 仅后端持有
- ai_request_logs
- 可按 projectId 查询

### Milestone 12 — 接入真实模型：先 Truth
- generateTruth
- 成功率 >95%（连续 20 次）
- 可显示 promptVersion

### Milestone 13 — 接入真实模型：派生（先角色）
- generateRoles(truthLocked)
- 追加/覆盖策略明确

### Milestone 14 — issues 真实化（先规则化再模型化）
- 规则引擎覆盖明显矛盾
- 再逐步模型化

---

## 5. 内测准备（5–20 人）

### Milestone 15 — 内测 SOP + 可观测 + 回滚策略
- 邀请名单、反馈表
- 关键路径告警（5xx/错误率）
- 数据迁移策略/向后兼容

**Gate 15**
- Truth + Roles 核心链路稳定
- requestId + 日志可定位
- 数据升级不丢失

---

## 6. 统一验收与证据要求
- 所有 Gate 证据必须落入 `docs/ops/online-acceptance-report.md` 或专项报告。
- 生产回归脚本必须在 5 分钟内可复验。
- 关键 API/页面路径需在验收记录中给出可复制命令。

---

## 7. 变更控制
- 未通过 Gate 不得启动下一里程碑。
- 任意架构级变更需补充迁移说明与回滚路径。
- 任何影响生产闭环的修改必须先跑 verify-online。
