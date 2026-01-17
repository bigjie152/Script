# 编辑器结构准备（Milestone 3）

目标：在不接入 TipTap、不过度重构 UI 的前提下，完成“可替换编辑引擎”的结构准备，保证后续替换不会回头改路由与业务流程。

## 设计原则
- 不引入新依赖：继续使用 textarea 作为最简编辑器。
- 不改动 API：PUT/GET 仍走既有 modules/truth 接口。
- 结构先于功能：先把抽象层落地，再接入 TipTap。

## 核心抽象

### 1. EditorDocument（统一文档类型）
统一结构：`content + text + 元信息`，用于跨模块复用。

- `content`：对齐 `{ type: "doc", content: [] }` 协议
- `text`：当前最小编辑器的可视文本
- `projectId/module`：路由与保存上下文

定义位置：`apps/web/types/editorDocument.ts`

### 2. Adapter（序列化边界）
负责在“编辑器内部状态”与“API payload”之间转换。

- `deserializeDocument(content, meta)`：API → EditorDocument
- `serializeDocument(document)`：EditorDocument → API payload
- `updateDocumentText(document, text)`：保持 `text` 与 `content` 一致

位置：`apps/web/editors/adapters/plainTextAdapter.ts`

### 3. DocumentEditor（可替换壳层）
统一编辑器接口，未来只需替换内部实现。

```tsx
<DocumentEditor
  value={document}
  onChange={setDocument}
  onSave={save}
  readonly={locked}
/>
```

位置：`apps/web/editors/DocumentEditor.tsx`

## 模块配置化
用配置驱动模块导航与端点映射，避免分散硬编码。

位置：`apps/web/modules/modules.config.ts`

包含字段：
- `moduleKey`
- `label`
- `apiEndpoint`
- `requiresTruthLocked`
- `editorType`（document/surface/truth）

## 迁移策略（渐进式）
- 至少 2 个模块使用 DocumentEditor（目前：overview、roles）。
- 其他模块继续沿用现有编辑实现，确保功能不回退。
- 后续每个模块迁移只需替换为 DocumentEditor。

## 当前状态
已完成结构准备，未接入 TipTap；仍使用 textarea 作为最简编辑器。
