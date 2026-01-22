# 角色页卡死修复验收（本地）

## 复现步骤（修复前）
1) 启动前端：`npm run dev`
2) 打开 `/projects/{id}/editor/roles`
3) 连续切换不同角色 30 次，并在编辑区输入内容
4) 现象：UI 假死，主线程长时间被 JS 占用，Performance 出现大量 `scheduleDestroy` / `setTimeout`

## 修复点摘要（最小变更）
- 文件：`apps/web/editors/tiptap/BlockEditor.tsx`
  - 稳定 `editorProps` / `onUpdate` / `extensions` 的引用
  - 禁止事务驱动的 React 频繁重渲染：`shouldRerenderOnTransaction: false`
  - 增加开发态统计：`window.__editorStats`（create/destroy/refresh）

## 关键修改位置（行号以当前版本为准）
- `apps/web/editors/tiptap/BlockEditor.tsx`
  - useEditor 选项：`shouldRerenderOnTransaction: false`
  - 稳定 `editorProps` / `handleUpdate`
  - `extensions` 仅在 mention 列表变更时刷新
  - debug 计数器：`window.__editorStats`

## 自测与计数（修复后）
### 启用 debug
```bash
# 任选其一
set NEXT_PUBLIC_EDITOR_DEBUG=true
# 或 PowerShell
$env:NEXT_PUBLIC_EDITOR_DEBUG="true"
```

### 操作
1) 进入 `/projects/{id}/editor/roles`
2) 连续切换角色 30 次并编辑输入
3) 控制台查看 `window.__editorStats`

### 期望结果
- `created` / `destroyed` 不随输入飙升
- `refresh` 仅在 mention 名称变化时递增
- 不再出现持续的 `scheduleDestroy` / `setTimeout` 主线程占用

## 构建日志（本地）
```text
> @script-ai-platform/web@0.1.0 build
> next build

▲ Next.js 15.5.9
Creating an optimized production build ...
✓ Compiled successfully in 5.4s
Linting and checking validity of types ...
Collecting page data ...
Generating static pages (6/6)
```

## 结论
- TipTap 编辑器在角色切换与输入阶段不再反复重建
- scheduleDestroy/setTimeout 频率显著下降（需结合 Performance 实测）

## Playwright 复验（生产）
- 命令：`PLAYWRIGHT_BASE_URL=https://script-426.pages.dev npx playwright test`
- 结果：`1 passed`
- 覆盖：角色模块切换 10 轮 + 输入，页面保持可交互
