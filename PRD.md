# 剧本AI助手（Script Collaboration Platform）PRD（V0.1–V1.0）
版本：PRD v1.0  
日期：2026-01-14  
负责人：方杰  
范围：本 PRD 覆盖从产品定位、用户与场景、功能需求、数据模型、AI 流程、权限与审计、指标埋点、里程碑到风险与验收标准的完整定义，用于后续交付给 Codex 进行工程搭建与实现。

---

## 1. 背景与问题定义

### 1.1 行业现状与痛点
剧本杀剧本创作面临的典型问题：
1) **创意同质化与想法枯竭**：创作端缺少系统化的灵感汇聚、共创机制与高质量反馈，导致作品趋同。  
2) **生产工具不匹配**：多数作者使用 Word/普通文档工具写作，难以管理剧本的“结构化对象”（真相、角色、线索、时间线、DM 手册等）以及它们之间的引用关系。  
3) **逻辑梳理与可玩性验证成本高**：剧本的逻辑一致性、角色动机、线索链路、时间线等依赖大量人工核验与线下试玩，效率低、返工多。  

### 1.2 机会与产品定位
本项目定位为：**面向职业作者为首攻用户的“结构化创作与协作平台”，并从第一天具备社区平台形态**（支持新手作者与玩家参与基础互动），通过“结构化编辑 + AI 编排式创作/审查 + 社区协作反馈”提升创作效率与质量。

---

## 2. 产品一句话定义（Project One-liner）
**面向剧本杀职业作者与创作爱好者的协作式创作平台，提供结构化剧本编辑与 AI 创作/审查能力，并通过社区共创与玩家反馈机制，提升剧本的新意产出效率与可玩性验证效率。**

---

## 3. 目标、边界与原则

### 3.1 产品目标（Goals）
- G1：显著缩短职业作者完成“一版可验证剧本初稿”的时间。  
- G2：显著降低逻辑一致性与可玩性验证的人工成本。  
- G3：从 V0.1 起具备“平台形态”：作品可公开/邀请/私有，社区可浏览与反馈，并产生可行动的有效建议。  

### 3.2 非目标（Non-goals）
- NG1：V0.x 不追求社交繁荣（粉丝关注、Feed、推荐算法、排行榜等）。  
- NG2：V0.1 不做多人实时协作编辑（可邀请评论/建议与受控共创）。  
- NG3：V0.1 不做离线模式。  
- NG4：V0.1 不做商业化分成、交易、版权结算等复杂机制（仅做归属与审计基础）。  

### 3.3 关键产品原则（Principles）
- P1：**完整剧情（真相）= 单一真理源（Single Source of Truth）**。  
- P2：AI 必须是**流程编排型**（非自由对话型），输出必须结构化、可回溯。  
- P3：编辑器是结构视图层，不是业务规则中心；业务规则由 Domain Services 控制。  
- P4：社区反馈必须可行动（可标记采纳、可绑定对象、可追踪闭环）。  

---

## 4. 用户分层与画像（Personas）

### 4.1 Primary Persona（首攻用户）：职业作者 / 工作室成员
- 目标：更快产出可商用、可玩的剧本；降低返工；可控地获取高质量反馈。  
- 痛点：结构管理困难（Word 低效）、逻辑校验耗时、AI 零散不可控、反馈渠道噪音大。  
- 成功定义：在更短时间内完成结构完整且通过初步校验的剧本版本，并可迭代优化。

### 4.2 Secondary Persona：新手作者 / 有创作欲望的玩家
- 目标：把想法变成可玩的剧本；在社区获得建议；参与共创。  
- V0.1 权益：注册、浏览公开作品、评论/建议、被邀请参与共创或测试。

### 4.3 Tertiary Persona：普通玩家
- 目标：发现有趣作品、提供体验视角反馈。  
- V0.1 权益：浏览公开作品、提交基础反馈（若开放）。

---

## 5. 核心使用场景（User Stories & Journeys）

### 场景 S1：从创意到“可验证初稿”
**当职业作者有一个新题材/新项目立项时，希望能在结构化环境中快速搭建完整剧本框架，并通过 AI 做逻辑/可玩性初检。**

关键步骤：
1) 新建剧本项目 → 填写简介/标签/人数  
2) 生成或编写完整剧情（真相）→ 反复迭代  
3) 锁定真相（Lock）  
4) 生成派生模块：角色剧本 / 线索 / 时间线 / DM 手册  
5) 一键一致性校验 → 生成问题列表 → 跳转修复  
6) 形成“可验证版本”并保存版本快照  

### 场景 S2：创作中途自检与修复
**作者完成一版关键段落后，希望快速发现冲突点并定位到对应模块。**

关键步骤：
1) 触发“逻辑/一致性审查”  
2) 输出结构化问题（冲突/缺失/冗余/建议）  
3) 标记问题状态（待处理/已解决/忽略）  
4) 回到相关模块编辑并提交新版本  

### 场景 S3：社区受控共创与评审
**作者希望在受控范围内公开或邀请他人提供建议，而非无序讨论。**

关键步骤：
1) 设置项目可见性（私有/邀请/公开）  
2) 发布项目页（包含简介与可浏览内容）  
3) 社区用户评论/建议  
4) 作者标记反馈采纳/无用 → 形成闭环数据  
5) 作者在版本说明中记录采纳内容（可选）

---

## 6. 成功指标（Metrics）

### 6.1 北极星指标（North Star）
- **完成一部“可验证剧本初稿”所需总创作时间（小时）**  
定义：从创建项目开始，到满足“结构完整 + 至少一次 AI 审查通过/生成问题清单并处理部分关键问题”的版本。

### 6.2 辅助指标（Supporting KPIs）
- K1：AI 建议采纳率（采纳/标记有用的建议数 ÷ AI 建议总数）  
- K2：结构模块完整度（包含必需模块且关联完整的项目占比/评分）  
- K3：每个公开项目的有效反馈数（被采纳/标记有价值/引发修改的反馈条数）

---

## 7. 版本规划与范围（V0.1 / V0.2 / V1.0）

### 7.1 V0.1（能跑 + 能证明价值）
目标：验证“职业作者效率提升 + AI 审查可用 + 社区最小形态成立”  
必须交付（Must）：
- 结构化剧本模型与编辑（A1）
- AI 顺序生成与锁定机制（B1）
- AI 一致性审查与问题列表（B2）
- 社区最小可用（C1：项目页 + 评论/建议 + 可见性）
- 审计日志（AI 调用与关键操作记录）
验收：≥5 位职业作者完成至少 1 个项目并产出可验证版本；AI 采纳率达到可见水平（如 ≥30% 作为初期目标）。

### 7.2 V0.2（能用 + 平台感增强）
- 结构化反馈（Issue 化）
- 版本对比（轻量 diff 或快照列表）
- AI 多角色试玩（简化版评分与风险点）
- 更清晰的模板/向导（提升新手参与）

### 7.3 V1.0（能留人）
- 作者复用（第二个项目创建率提升）
- 作品迭代闭环成熟（反馈→采纳→版本说明）
- 扩展：更强的权限/协作、质量评估体系、可选商业化前置能力（仅预研）

---

## 8. 功能需求（Functional Requirements）
说明：按子系统拆分，包含 Must/Should/Could、验收标准、关键交互与数据要求。

---

### 8.1 子系统 A：结构化剧本编辑与项目管理（A）

#### A0 用户与身份（基础）
- A0.1 注册/登录（邮箱或第三方可选，V0.1 以最简单可用为准）
- A0.2 用户主页：我的项目列表（创建/编辑/可见性状态）

验收：
- 用户可注册登录并创建项目；未登录用户可浏览公开项目（若开放）。

---

#### A1 剧本结构化模块（V0.1 Must）
**模块集合（一级模块）**
- 剧本简介（Overview）
- 完整剧情（真相 / Truth，Ground Truth）
- 角色剧本（Roles）
- 线索（Clues）
- 时间线（Timeline）
- DM 手册（DM Guide）

**关键规则**
- Truth 是单一真理源，具备状态：Draft / Locked
- Roles/Clues/Timeline/DMGuide 必须引用 truthId + truthVersion（或 truthSnapshotId）
- 允许人工编辑派生模块，但必须可被一致性校验检测到冲突

**编辑器策略**
- 优先集成成熟编辑器（Tiptap/ProseMirror），平台负责结构协议与模块关系
- 编辑器作为“视图层”，不得将业务规则写死在编辑器插件中

**交互要求（V0.1）**
- 项目左侧：模块导航（6 个模块）
- 主编辑区：模块内容编辑
- 顶部：项目状态（草稿/锁定真相/已发布）
- 模块之间关联入口（例如线索关联角色/剧情节点）

验收：
- 能创建并编辑以上 6 个模块内容；能保存并再次打开保持一致；Truth 可锁定。

---

#### A2 模块关联（V0.1 Must，最小实现）
- A2.1 Role ↔ FlowNode/Timeline（角色参与事件）
- A2.2 Clue ↔ Role/FlowNode（线索指向对象）
- A2.3 DMGuide 可引用 Role/Clue/FlowNode

最小交互：
- 关联采用选择器（下拉/搜索）或引用标记（@ / #）
- 存储为结构化关系（relation tables），不依赖纯文本

验收：
- 至少能建立并持久化上述三类关联；能在模块中查看已关联对象列表。

---

#### A3 保存与版本（V0.1 Must：快照级；V0.2：对比）
- A3.1 自动保存（可按时间/变更触发）
- A3.2 版本快照：作者手动“创建版本”（写版本说明）
- A3.3 Truth 锁定后：创建 Truth Snapshot（truthVersion++ 或 snapshotId）

验收：
- 版本列表可查看；可回滚到某个版本（V0.1 可选，至少能读取旧版本内容）。

---

### 8.2 子系统 B：AI 编排式创作与审查（B）

#### B0 AI 基础能力（平台级）
- B0.1 选择模型提供方（配置 DeepSeek 等 API Key）
- B0.2 Prompt 模板版本化（promptVersion）
- B0.3 AI 调用审计记录（requestId、输入摘要、输出摘要、关联 truthSnapshot）

验收：
- 每次 AI 调用可在日志中定位；可追溯到具体项目/模块/版本。

---

#### B1 AI 顺序且可控的生成流程（V0.1 Must）
**核心机制：生成 → 迭代 → 锁定 → 派生生成**
- B1.1 生成 Truth（完整剧情）
  - 输入：项目简介、风格、人数等
  - 输出：Truth 文本（结构建议：可分章节/事件列表）
- B1.2 Truth 迭代（作者可多次触发“重写/优化/补全”）
- B1.3 Lock Truth（锁定真相）
  - 需要显式用户操作
  - 锁定后生成 truthSnapshotId（或 truthVersion）
- B1.4 派生生成（严格依赖 truthSnapshot）
  - 生成 Roles（每个角色的已知/隐瞒/动机/行动）
  - 生成 Clues（线索内容、发现方式、指向关系建议）
  - 生成 Timeline（真实时间线，按事件节点）
  - 生成 DMGuide（流程控制点与风险提示）

**强约束**
- 派生阶段 Prompt 必须包含 truthSnapshot 内容（或摘要 + 关键事实列表）
- 生成时禁止引入与 truthSnapshot 冲突的新事实；若模型输出冲突内容，系统应标记“冲突候选”并进入一致性校验队列

验收：
- 作者可完成：生成 Truth → 锁定 → 一键生成派生模块；派生内容可写入对应模块并可编辑。

---

#### B2 AI 一致性校验（V0.1 Must）
- B2.1 一键校验：Truth ↔ Roles/Clues/Timeline/DMGuide
- B2.2 输出结构化问题列表（Issue-like）
  - 类型：冲突/缺失/冗余/不清晰/建议
  - 严重程度：P0/P1/P2
  - 关联对象：RoleId / ClueId / FlowNodeId / Module
  - 建议动作：修改哪一处、补充什么

- B2.3 问题状态管理
  - 状态：Open / In Progress / Resolved / Ignored
  - 记录处理人、处理时间、关联版本

验收：
- 校验输出可读、可定位；点击问题可跳转到对应模块（至少跳转模块级，V0.2 再做到节点级）。

---

#### B3（V0.2 Should）AI 多角色试玩（简化版）
- 输入：truthSnapshot + roles + timeline + clues
- 输出：
  - 可玩性评分（节奏、信息量、推理链完整度）
  - 风险点（玩家可能卡住、关键线索不易获取等）
- 不要求真实对话跑团，强调结构化评分与风险提示

---

### 8.3 子系统 C：社区与协作（C）

#### C0 可见性与发布（V0.1 Must）
- C0.1 项目可见性：Private / Invite-only / Public
- C0.2 发布项目页（Public/Invite）：展示信息
  - 必展示：剧本简介、标签、作者、版本、更新时间
  - 可选展示：部分模块内容（V0.1 可默认只展示简介 + 章节目录 + 摘要，避免版权风险）

验收：
- 未登录或普通用户可访问公开项目页（受控）；邀请制项目需授权访问。

---

#### C1 评论与建议（V0.1 Must：极简）
- C1.1 评论（Comment）
- C1.2 建议（Suggestion）
  - 与评论区分（用于统计有效反馈）
- C1.3 作者反馈处理
  - 标记：有用/无用
  - 采纳：关联到版本说明或问题列表（最小实现：仅记录采纳状态）

验收：
- 每条反馈可被作者标记；有效反馈可用于 KPI 统计。

---

#### C2（V0.2 Should）Issue 化反馈（结构化）
- 反馈可绑定对象：Role/Clue/FlowNode/Module
- 具备状态流转与协作讨论（类似 GitHub Issue/Review）
- 与 B2 的问题列表可合并为统一的“Issue 系统”（后续演进）

---

## 9. 权限模型与安全（Access Control）

### 9.1 角色（Roles）
- ProjectOwner（项目拥有者/作者）
- Collaborator（受邀共创者，V0.2+）
- Viewer（可查看者：公开或受邀）
- Guest（未登录访客，仅公开可见）

### 9.2 权限规则（V0.1）
- 私有项目：仅 Owner 可读写
- 邀请制：受邀用户可读；写权限 V0.1 可不开放（或仅允许反馈）
- 公开项目：任何人可读项目页；可否评论由配置决定（默认登录后可评论）

### 9.3 安全与合规（V0.1）
- API 访问必须鉴权
- 敏感信息（API Key）仅存服务端
- 速率限制（至少对 AI 接口与评论接口）
- 基础内容审查（可留到 V0.2，根据风险评估）

---

## 10. 审计、日志与可追溯（Audit & Observability）

### 10.1 AI 审计（必须）
每次 AI 调用必须记录：
- requestId
- userId
- projectId
- actionType（deriveTruth / deriveRole / consistencyCheck 等）
- inputRef（truthSnapshotId、moduleIds）
- promptVersion
- modelProvider + modelName
- tokens（若可获取）
- outputRef（生成内容对应 entityId 列表）
- createdAt

### 10.2 关键用户操作日志（必须）
- Lock/Unlock Truth
- Create Snapshot/Version
- Publish/Change visibility
- Accept/Reject feedback
- Resolve/Ignore AI issues

---

## 11. 数据模型（Data Model）
目标：支撑结构化模块、关系引用、Truth 锁定与版本、一致性校验、社区反馈与审计。

### 11.1 核心实体（Entities）
- Project
- Truth (Ground Truth)
- TruthSnapshot（或 truthVersion）
- Role
- Clue
- FlowNode（剧情节点/时间线节点）
- DMGuide（可作为模块实体或文档）
- DocumentBlock / ProseMirrorJSON（内容载体）
- Relationship（关联关系）
- Issue（AI 校验问题 & 社区建议的统一模型，V0.1 可先拆分）
- Comment/Suggestion（V0.1 可独立）
- AuditLog / AIRequestLog
- User / Membership / Invitation

### 11.2 Truth 锁定与派生规则（必须实现）
- Truth: status = Draft | Locked
- Lock 时生成 truthSnapshotId（不可变）
- 派生内容必须引用 truthSnapshotId
- 若 Truth 解锁并修改，需生成新的 truthSnapshotId，旧派生内容标记“过期”（stale=true）

### 11.3 关系模型（示例）
- role_to_flownode (roleId, flowNodeId, relationType)
- clue_to_role (clueId, roleId, relationType)
- clue_to_flownode (clueId, flowNodeId, relationType)
- dmguide_to_*（可选）

---

## 12. AI 工作流规范（Orchestrator Spec）
目标：将 AI 从“聊天工具”变成“可控生产流水线”。

### 12.1 Orchestrator 动作列表（V0.1）
- generateTruth(projectId, inputs) -> truthDraft
- reviseTruth(truthId, instruction) -> truthDraft
- lockTruth(truthId) -> truthSnapshotId
- derive(projectId, actionType=role, truthSnapshotId) -> items[]
- deriveClues(projectId, truthSnapshotId) -> clues[]
- deriveTimeline(projectId, truthSnapshotId) -> flowNodes[]
- deriveDMGuide(projectId, truthSnapshotId) -> dmGuide
- consistencyCheck(projectId, truthSnapshotId, entityIds?) -> issues[]

### 12.2 输出要求（强制）
- 派生输出必须可解析为结构化对象（JSON schema 或至少具备稳定字段）
- 一致性校验输出必须是列表结构：[{type, severity, message, refs, suggestion}]
- 所有输出必须附带引用 truthSnapshotId

### 12.3 Prompt 管理
- 每个 actionType 有独立 prompt 模板
- promptVersion 可升级但保持可回溯
- 支持环境变量切换模型/参数（temperature 等）

---

## 13. 关键页面与交互（UX / IA）

### 13.1 IA（信息架构）
- 首页（社区发现：V0.1 可极简）
- 登录/注册
- 我的项目（Dashboard）
- 项目编辑页（核心）
- 项目公开页（社区）
- 设置（账号、API key 可选仅管理员）

### 13.2 项目编辑页（核心）
布局建议：
- 左侧：模块导航（简介/真相/角色/线索/时间线/DM）
- 中间：编辑器区域（Tiptap）
- 右侧：上下文面板（AI 操作/问题列表/引用关系）

关键交互：
- Truth 模块有“生成/迭代/锁定”按钮
- Truth 锁定后派生模块提供“一键生成”入口
- 一致性校验按钮常驻
- 问题列表可点击跳转模块

### 13.3 项目公开页（社区）
- 顶部：项目简介、作者、标签、版本
- 内容：摘要/目录（V0.1 可只展示概要与部分内容）
- 反馈区：评论/建议
- 作者可见：反馈处理操作（采纳/标记）

---

## 14. 埋点与数据采集（Analytics）
目标：支撑 KPI 计算与产品迭代。

### 14.1 必须埋点事件（V0.1）
- project_created
- truth_generated / truth_revised
- truth_locked
- derive_roles/clues/timeline/dmguide
- consistency_check_run
- issue_resolved/ignored
- project_published / visibility_changed
- feedback_created (comment/suggestion)
- feedback_marked_useful / feedback_adopted
- version_snapshot_created

### 14.2 指标计算映射
- 北极星：project_created → first_validated_snapshot_time
- AI 采纳率：adopted_suggestions / total_suggestions
- 结构完整度：模块完成情况 + 关联数量阈值
- 有效反馈数：marked_useful + adopted

---

## 15. 部署与环境规划（Cloudflare → 阿里云）
目标：前期快速验证，后期可迁移且不深度绑定。

### 15.1 环境划分
- Dev（本地）
- Staging（Cloudflare：测试）
- Prod（阿里云：正式）

### 15.2 关键原则
- 业务逻辑与 Orchestrator 尽量云无关（避免使用过多特定平台专有 API）
- 配置通过环境变量注入
- 数据库优先使用通用 RDBMS（便于迁移）

---

## 16. 依赖与约束（Constraints）
- AI 模型：不自训，使用第三方 API（DeepSeek 等）
- 编辑器：不自研，从成熟编辑器集成改造
- V0.1 不做：实时协作、离线、复杂社交、商业化

---

## 17. 风险与对策（Risks & Mitigations）

### R1 AI 输出不稳定 / 幻觉
- 对策：Truth 锁定 + 派生依赖 + 一致性校验强制化；输出结构化；冲突标记。

### R2 职业作者不愿意迁移工作流
- 对策：编辑器体验优先稳定；结构化模块减少“强约束摩擦”；支持导入/复制（V0.2）。

### R3 社区早期噪音大、低质量反馈
- 对策：V0.1 只做最小反馈；采纳机制与有效反馈指标；邀请制与可见性控制。

### R4 版权与泄露
- 对策：默认不公开全文；公开页展示摘要；访问控制；审计记录；后续加水印/导出策略（V0.2+）。

### R5 AI 成本失控
- 对策：流程编排、限制频次、缓存 truthSnapshot 摘要、对长文做分段/摘要。

---

## 18. 验收标准（Acceptance Criteria）

### V0.1 总体验收
- AC1：职业作者可完成：创建项目 → 生成/编辑 Truth → 锁定 → 派生生成 → 一致性校验 → 处理问题 → 生成可验证版本快照  
- AC2：项目具备可见性（私有/邀请/公开），公开页可被访问，反馈可提交与被作者处理  
- AC3：AI 调用与关键操作可审计可追溯  
- AC4：基础 KPI 可计算（至少通过日志与事件表）  
- AC5：≥5 位职业作者完成至少 1 个项目，能提供可验证版本并反馈工具有效性  

---

## 19. 里程碑与交付计划（Milestones）
建议里程碑（可按周拆）：
- M0：PRD 冻结 + 数据模型草案确定
- M1：项目/用户/可见性基础完成（A0/C0）
- M2：编辑器集成 + 6 模块编辑完成（A1）
- M3：Truth 锁定 + 派生生成（B1）
- M4：一致性校验 + 问题列表（B2）
- M5：社区反馈闭环（C1）+ 审计日志
- M6：Staging 部署（Cloudflare）+ 试用测试
- M7：V0.1 验收与迭代计划（进入 V0.2）

---

## 20. 附录：需求清单（MoSCoW 汇总）

### Must（V0.1）
- 结构化模块：简介/真相/角色/线索/时间线/DM
- Truth 锁定与 truthSnapshot
- 派生生成：角色/线索/时间线/DM
- 一致性校验输出结构化问题列表
- 项目可见性：私有/邀请/公开
- 项目页 + 评论/建议 + 采纳标记
- 审计日志（AI 与关键操作）
- 基础版本快照

### Should（V0.2）
- Issue 化反馈（对象绑定）
- 版本对比（轻量）
- AI 多角色试玩评分
- 导入/模板/向导

### Could（V1.0+）
- 更细权限与协作
- 商业化、授权与水印导出
- 推荐与发现（谨慎）
- 插件化

---

## 21. 术语表（Glossary）
- Truth：完整剧情/真相，单一真理源  
- TruthSnapshot：锁定后的真相快照，用于派生与审计  
- Entity：结构化对象（Role/Clue/FlowNode 等）  
- Orchestrator：AI 流程编排服务，执行顺序生成与一致性校验  
- Issue：结构化问题/反馈项，可来自 AI 校验或社区建议  

---
PRD 结束
