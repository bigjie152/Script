# 阶段 2 前置条件验收清单

> 目的：确保进入阶段 2 前，Workspace → Editor 的最小闭环与编辑器结构稳定可验收。
> 说明：本清单只覆盖“前置条件”，不包含 TipTap/AI 接入。

## 环境信息
- 生产域名：`https://script-426.pages.dev`
- API 入口：同域 `/api/*`

## 验收步骤与预期

### P0 Workspace → Editor 最小闭环稳定
- [ ] `/workspace` 点击「新建项目」创建成功并进入 `/projects/{id}/editor/overview`
- [ ] `/projects/{id}/editor/truth` 可编辑并保存（PUT `/api/projects/{id}/truth`）
- [ ] 刷新编辑器页面后，Truth 内容保持一致（GET `/api/projects/{id}`）
- [ ] `/api/projects/{id}/issues` 返回 200，空列表为 `[]`

### P1 编辑器可用性与导航
- [ ] 所有模块页顶部均存在「返回 Workspace」按钮，并可直接跳回 `/workspace`
- [ ] `/projects/{id}/editor` 仅作为默认入口，重定向到 `/projects/{id}/editor/overview`
- [ ] `/projects/{id}/editor/[module]` 模块路由均可达且不被覆盖

### P2 Truth 状态机与权限门控
- [ ] Draft 状态可编辑；点击「锁定真相」进入 Locked（只读）
- [ ] Locked 状态可点击「解锁真相」，确认后回到 Draft 并恢复编辑
- [ ] 锁定/解锁时提示文案清晰可见

### P3 AI 面板信息架构
- [ ] 「生成角色」仅在“派生生成”板块
- [ ] 「逻辑审查 / 一致性检查」为独立板块，不在“派生生成”内
- [ ] Truth Core 仅包含：状态、锁定/解锁（无派生/逻辑审查混入）

## 复验路径（生产）
1. `https://script-426.pages.dev/workspace`
2. 新建项目 → 跳转 `https://script-426.pages.dev/projects/{id}/editor/overview`
3. 切换到 `truth` → 编辑 → 保存 → 刷新
4. 观察右侧面板：Truth Core / 派生生成 / 逻辑审查 三块结构
5. 锁定/解锁交互确认提示

## 备注
- 本清单通过后，才进入阶段 2（适配层与 mock 结构准备）。
