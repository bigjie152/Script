# 阶段 2 结构准备（适配层与 Mock 状态机）

> 目标：为后续 TipTap/AI 接入预留结构，不改变现有 API，不引入新依赖。

## 1. 文档模型适配层

位置：`apps/web/lib/editorDocument.ts`

### 定义
- `EditorDocument`：当前编辑器的最小文档模型（仅包含 `text`）。
- `fromTruthContent(content)`：从后端 Truth 内容（JSON）提取文本，供 textarea 渲染。
- `toTruthContent(document)`：将 `EditorDocument` 转为最小 ProseMirror-like JSON（type/doc/paragraph/text）。

### 使用位置
- `apps/web/hooks/useTruthDocument.ts`
  - `fromTruthContent`：用于加载 truth
  - `toTruthContent`：用于保存 truth

> 后续接入 TipTap 时，仅需替换 `EditorDocument` 与适配函数实现，页面与 hook 不需要大改。

## 2. AI Mock 状态机

位置：`apps/web/hooks/useMockAi.ts`

### 定义
- `useMockAiTasks()` 提供两个动作：
  - `deriveRoles`
  - `reviewLogic`
- 每个动作包含 `status`（idle/pending/success/error）与 `message`。

### 使用位置
- `apps/web/features/project-editor/EditorShell.tsx`
  - 将 `status/message` 传入 `AIPanel`
- `apps/web/features/ai-panel/AIPanel.tsx`
  - 按状态渲染按钮 loading 与提示文案

> 当前不调用任何真实 AI 接口，仅前端状态模拟。

## 3. 仍保持的约束
- 不接入 TipTap / ProseMirror
- 不接入真实 AI
- 不改动后端 API
- 不回退 Workspace → Editor → 保存闭环
