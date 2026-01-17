# TipTap 接入策略（Milestone 4）

本阶段目标：在不改变 API 与布局的前提下，将所有模块统一为 TipTap 编辑内核，保留旧数据兼容性，并提供“高级但克制”的编辑能力。

## 1. 接入原则
- 仅更换编辑内核，不改 API、schema、路由或三栏布局。
- 通过 `DocumentEditor` 与 Adapter 接入，避免页面级侵入。
- 旧数据 `{ type:"doc", content:[] }` 100% 可渲染与回写。

## 2. 编辑能力范围
基础能力（StarterKit 精选）：
- 段落、标题、列表、引用、换行、撤销/重做

高级能力（Milestone 4 承载）：
- Database-like block（结构化信息块）
- Slash Command（快速插入标题/列表/模板/数据库块）
- Mention（@角色/@线索/@时间线）

说明：以上能力仅作用于编辑层，不引入语义联动与自动生成。

## 3. 数据兼容策略
- 编辑器保存 JSON 仍为 ProseMirror doc 结构。
- Adapter 负责 `serialize/deserialize`，并保留 `content` 原样结构。
- `text` 仅作为 UI 状态与回读提示，不作为最终存储来源。

## 4. 结构落点
- `apps/web/editors/DocumentEditor.tsx`：统一入口（TipTap 内核）
- `apps/web/editors/adapters/plainTextAdapter.ts`：序列化边界
- `apps/web/editors/tiptap/*`：Database-like / Slash / Mention

## 5. 验收重点
1) 全模块编辑 → 保存 → 刷新一致  
2) Slash / Mention / Database-like 可用  
3) 基线 verify-online 不回退
