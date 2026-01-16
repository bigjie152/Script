# 前端实现规范（V0.1）

> 使用技能：frontend-design  
> 目标：在不引入复杂架构的前提下，产出可维护、可扩展、具备明显审美风格的前端实现规范。

## 1. 设计方向与视觉基调

**方向**：精致极简 + 轻雾玻璃（Apple-like Minimal + Soft Glass）  
**记忆点**：柔和的玻璃卡片与大留白，极简图标与克制动效，页面像“轻雾画廊”。  
**核心约束**：中文友好、信息密度低、交互明确、可读性优先。

### 字体策略（避免通用字体）
- 标题/强调：`Sora`（英文字母有识别度，几何感克制）
- 正文/中文：`Noto Sans SC`（中文清晰、与 Sora 兼容）
- Next.js 建议：`next/font/google` 按需加载

### 颜色与材质
- 背景：浅暖灰 + 低对比渐变（避免纯白平铺）
- 卡片：白色 8–16% 透明 + 轻模糊（backdrop-blur）
- 强调色：深蓝灰/墨色（用于按钮、标题）
- 状态色：成功（柔绿）、警示（柔橙）、错误（柔红）

### 动效原则
- 首屏加载：0.2–0.4s 淡入 + 位移动画（分段延迟）
- Hover：轻微缩放 + 轻阴影加强（0.1–0.2s）
- 操作反馈：按钮状态变化（loading/disabled）

## 2. 目录结构与组件划分

基于现有 `apps/web` 结构扩展（不新增多余层级）：

```
apps/web/
  app/
    page.tsx                  # 根路由 -> /workspace 重定向
    workspace/page.tsx
    projects/[id]/editor/[module]/page.tsx
  components/
    layout/Sidebar.tsx
    layout/TopNav.tsx
    common/Button.tsx
    common/EmptyState.tsx
    common/ErrorBanner.tsx
    common/TabGroup.tsx
    editor/EditorSurface.tsx
  features/
    project-editor/EditorShell.tsx
    ai-panel/AIPanel.tsx
    issue-panel/IssuePanel.tsx
  services/
    apiClient.ts
    projectApi.ts
    truthApi.ts
    issueApi.ts
  hooks/
    useAsync.ts
    useProject.ts
  styles/
    globals.css               # Tailwind + CSS 变量
```

## 3. 路由与页面布局约定

### Workspace `/workspace`
- 左侧全局侧边栏 + 右侧主内容区
- 顶部：搜索框（占位）、通知入口（占位）、新建项目按钮（真实可用）
- 主区：最近编辑（可 mock）+ 项目卡片列表（点击进入编辑器）

### Editor `/projects/[id]/editor/[module]`
- 三栏结构：
  - 左栏：模块导航（概览/真相/角色/线索/时间线/DM）
  - 中栏：编辑区（Tiptap）
  - 右栏：工具面板（Tab：AI / 问题列表）
- 默认 module：`overview`

## 4. 组件命名与职责

- `layout/*`：布局级容器（Sidebar/TopNav/EditorShell）
- `common/*`：基础组件（Button/Badge/TabGroup/EmptyState）
- `editor/*`：编辑器 UI（只处理渲染与输入）
- `features/*`：功能聚合（AI 面板、问题列表面板）

命名规则：
- 组件名：`PascalCase`
- hooks：`useXxx`
- 页面级组件仅负责拼装，不处理复杂逻辑

## 5. 状态与请求约定

### 状态管理
- 默认 React 本地 state + hooks
- `useAsync` 封装 loading/error
- 不引入复杂状态机

### API Client
- 统一封装于 `services/apiClient.ts`
- 统一处理：
  - baseUrl（`NEXT_PUBLIC_API_BASE_URL`）
  - 错误格式 `{ error: { message } }`
  - 超时（如 8–12s）
- 页面不直接调用 `fetch`

## 6. 交互一致性与错误提示

### 按钮与状态
- 主按钮：实心，强调色
- 次按钮：描边/浅色
- 禁用：降低透明度，禁止 hover

### 空状态文案（中文）
- “暂无项目”
- “暂无问题”
- “加载失败，请重试”

### 错误策略
- 统一显示 `ErrorBanner`（顶部或卡片内）
- 提示必须中文且明确动作

## 7. 可访问性与键盘支持

- 所有交互组件可 `Tab` 聚焦
- `focus-visible` 明确
- Tab 组件支持键盘切换
- 颜色对比符合可读性标准

## 8. Tiptap 编辑器约定

- 保存 JSON 结构（ProseMirror JSON）
- Truth 模块：
  - 首次加载从 API 拉取
  - 允许编辑并保存（显式按钮）
  - 锁定后只读提示

## 9. V0.1 页面交付范围

- Workspace：可创建项目并进入编辑器
- Editor：
  - Overview：展示项目基本信息
  - Truth：加载/编辑/保存
  - AI 面板：锁定真相/生成角色/一致性检查
  - 问题列表：拉取 issues 并展示
- Roles/Clues/Timeline/DM：占位或只读

## 10. 未来扩展提示

- Workspace 项目列表：缺少 `GET /api/projects`，仅在文档标记需求，不改后端
- 编辑器侧栏：未来可加入版本记录、操作历史