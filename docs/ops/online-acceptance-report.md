# 线上验收报告（Milestone 0 + Milestone 2）

验收时间：2026-01-17 19:45 +08:00  
base_url：https://script-426.pages.dev  
commit：bd4969d  
环境：Cloudflare Pages / Production

## 1) D1 Schema 变更（生产）
执行命令：
```bash
npx wrangler d1 execute script-staging --file=./d1-schema.sql --remote
```
校验命令：
```bash
npx wrangler d1 execute script-staging --command="select name from sqlite_master where type='table' and name='module_documents';" --remote
```
校验结果：`module_documents` 存在。

## 2) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 3) Modules API 回归（PUT → GET 一致）
项目：`projectId=9a9679f9-979a-4958-9b99-8d9f3da985a7`

### overview
- PUT /api/projects/{id}/modules/overview → 200（documentId=5e7dec53-4e75-4c16-a62f-8b3f844702eb）
- GET /api/projects/{id}/modules/overview → content.text = `overview-content-194451`

### roles
- PUT /api/projects/{id}/modules/roles → 200（documentId=f905b9b3-b642-43a1-85b4-139c18a54dbe）
- GET /api/projects/{id}/modules/roles → content.text = `roles-content-194453`

### clues
- PUT /api/projects/{id}/modules/clues → 200（documentId=4c9cd88c-f893-4f9f-8f71-1ab13387abd9）
- GET /api/projects/{id}/modules/clues → content.text = `clues-content-194456`

### timeline
- PUT /api/projects/{id}/modules/timeline → 200（documentId=15133d15-d41d-4d5d-81f1-bf9e13833204）
- GET /api/projects/{id}/modules/timeline → content.text = `timeline-content-194459`

### dm
- PUT /api/projects/{id}/modules/dm → 200（documentId=7a5e0b9e-f551-47dd-81f4-347a2fe4881a）
- GET /api/projects/{id}/modules/dm → content.text = `dm-content-194501`

## 4) 结论
- 生产 D1 已完成 schema 更新
- modules API 五个模块 PUT/GET 回读一致
- 基线接口未回退

---

# Milestone 3 门禁验收（结构准备期）

验收时间：2026-01-17 20:29:19 +08:00  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 2) 新壳层模块验证（overview / roles）
项目：`projectId=bdea25e0-c3f0-4afd-bca2-d62b12e21bbb`

- overview：PUT → GET 回读一致  
  content.text = `模块 overview 回读测试`
- roles：PUT → GET 回读一致  
  content.text = `模块 roles 回读测试`

## 3) 旧实现模块回归（clues / timeline / dm）
同项目：

- clues：PUT → GET 回读一致  
  content.text = `模块 clues 回读测试`
- timeline：PUT → GET 回读一致  
  content.text = `模块 timeline 回读测试`
- dm：PUT → GET 回读一致  
  content.text = `模块 dm 回读测试`

## 4) 结论
- verify-online 基线未回退
- DocumentEditor 与旧 EditorSurface 共存稳定

---

# Milestone 4 Gate 4 验收（TipTap 全模块）

验收时间：2026-01-17 21:20 +08:00  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 2) TipTap 全模块一致性（PUT → GET）
项目：`projectId=d50cf527-88cd-4369-8e51-618afc805747`

每个模块连续保存 10 次（含 heading / mention / databaseLike），共计 60 次：
- overview：10/10
- truth：10/10
- roles：10/10
- clues：10/10
- timeline：10/10
- dm：10/10

样例（第 1 次保存的回读内容）：
- overview：`module-overview-save-1`
- truth：`module-truth-save-1`
- roles：`module-roles-save-1`
- clues：`module-clues-save-1`
- timeline：`module-timeline-save-1`
- dm：`module-dm-save-1`

## 3) 旧数据兼容性（M4 之前）
旧项目：`projectId=9a9679f9-979a-4958-9b99-8d9f3da985a7`  
- GET /api/projects/:id → 200  
- GET /api/projects/:id/modules/overview → content.text = `overview-content-194451`

## 4) 性能主观验证
备注：本次仅完成 API 层回归，UI 输入性能需在浏览器侧主观确认。

## 5) 结论
- TipTap 全模块保存/回读一致
- 基线回归未回退
- 旧数据可正常回读

---

# Milestone 5/6 门禁验收（账号与归属）

验收时间：2026-01-18 04:44 +08:00  
base_url：https://script-426.pages.dev  
commit：69dd4ff  
环境：Cloudflare Pages / Production

## 1) Gate 5 — 账号系统
账号 A：`gate_a_2633`

- POST /api/auth/register → 201  
  `{"user":{"id":"5db2d23c-2b66-499f-9176-32db6ff9d8fe","username":"gate_a_2633"}}`
- POST /api/auth/login → 200  
  `{"user":{"id":"5db2d23c-2b66-499f-9176-32db6ff9d8fe","username":"gate_a_2633"}}`
- GET /api/auth/me（登录态）→ 200  
  `{"user":{"id":"5db2d23c-2b66-499f-9176-32db6ff9d8fe","username":"gate_a_2633"}}`
- POST /api/auth/logout → 200  
  `{"status":"ok"}`
- GET /api/auth/me（登出后）→ 200  
  `{"user":null}`
- 未登录创建项目：POST /api/projects → 401  
  `{"error":{"message":"login required"}}`

## 2) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201（projectId=a66c7ffa-e110-49db-b34a-bc15a9720d28）
- GET /api/projects/:id 200（ownerId=65037eb3-2209-45e3-9aca-bad30c5e2844）
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 3) Gate 6 — 数据归属与权限
账号 Owner：`gate_owner_6527`  
账号 Other：`gate_other_6527`

- Owner 创建项目 → 201  
  `projectId=2a07c690-35eb-4586-82a1-7acd46436846`
- GET /api/projects/:id → 200  
  `ownerId=695e94c2-88f9-46ba-a2c4-1f0b11f7c68a`
- Other 对 Owner 项目 PUT /truth → 403  
  `{"error":{"message":"forbidden"}}`

备注：项目列表接口尚未实现，因此 “A 看不到 B 的私有项目” 仅做写入权限校验。

## 4) 结论
- Gate 5 通过：注册/登录/登出与会话保持正常
- Gate 6 通过：Project 归属与写权限校验生效
- verify-online 回归不回退

---

# Milestone 7 Gate 7 验收（Workspace 列表/预览）

验收时间：2026-01-18 05:47 +08:00  
base_url：https://script-426.pages.dev  
commit：5ad0ef9  
环境：Cloudflare Pages / Production

## 1) 列表权威性（GET /api/projects?scope=mine）
登录用户：`smoke_user`

- GET /api/projects?scope=mine&sort=updatedAt → 200  
  返回示例（截断）：
  ```json
  {
    "projects": [
      { "id": "6abfec4b-fbad-432b-ac1b-e5ef55d6b090", "name": "List B", "updatedAt": "2026-01-17 21:12:51", "truthStatus": "Draft" },
      { "id": "a273be61-873b-4ace-bbef-5f65bad7c65f", "name": "List C", "updatedAt": "2026-01-17 21:12:51", "truthStatus": "Draft" },
      { "id": "73a83dd0-6a3d-469e-98c5-9a9912ccb54e", "name": "List A", "updatedAt": "2026-01-17 21:12:50", "truthStatus": "Draft" }
    ]
  }
  ```

## 2) 搜索与排序
- GET /api/projects?scope=mine&sort=updatedAt&q=List → 200  
  返回仅包含 List A/B/C（与 q 匹配）

## 3) 刷新一致性（updatedAt 更新）
- 对 List A 执行 PUT /api/projects/{id}/truth 后再查询列表  
  List A updatedAt 更新并排至首位：
  ```json
  { "id": "73a83dd0-6a3d-469e-98c5-9a9912ccb54e", "updatedAt": "2026-01-17T21:45:23.625Z" }
  ```

## 4) 只读预览
- 访问 `/projects/{id}/preview` 返回 200（示例项目：73a83dd0-6a3d-469e-98c5-9a9912ccb54e）
- 预览页为只读模式；owner 可见“进入编辑器”入口

## 5) 权限（非 owner 列表）
- 新注册用户 list_user_xxxx：GET /api/projects?scope=mine → 200  
  返回 `projects: []`

## 6) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200
- stability 20/20 成功

## 7) 结论
- Workspace 列表已由后端权威接口驱动
- 刷新后项目不丢失，updatedAt 与排序符合预期
- 只读预览路径可访问

---

# Milestone 8 Gate 8 验收（编辑器定型期）

验收时间：2026-01-17 23:02 +08:00  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 生产 D1 schema 应用
执行：
```powershell
npx wrangler d1 execute script-staging --remote --file=../../d1-schema.sql
```
校验：
```powershell
npx wrangler d1 execute script-staging --remote --command "PRAGMA table_info(projects);"
```
结果摘要：`projects.meta` 已存在（生产 D1）。

## 2) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201（projectId=eeebf33f-e5b3-4169-b25e-e477cf5bb532）
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 3) Block Editor 全模块一致性（UI）
说明：需要在浏览器侧执行编辑与保存验证（overview / truth / roles / clues / timeline / dm）。
当前尚未完成 UI 侧 Gate 8 验收，待人工补充以下证据：
- 各模块连续保存 ≥20 次
- 刷新后一致
- 跨模块切换后一致

## 4) 实体关联（@/#）验证
说明：需在浏览器侧验证 @角色 / #线索 插入与点击定位效果。

## 5) 结论
- 生产 D1 已完成 schema 应用（meta 字段）
- 基线回归未回退
- UI 层 Gate 8 仍待人工验证与固化

---

# Milestone 8.5 Gate 8.5 验收（Block Editor 体验收敛）

验收时间：2026-01-19 09:52 +08:00  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：
- POST /api/projects 201（projectId=b556a5c1-ffff-4547-b4c3-5bb491c23997）
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- stability 20/20 成功

## 2) Block Editor 可见 UI 验证（待补）
需在浏览器侧完成以下走查，并补充截图/说明：
- Bubble Menu：选中文本可用
- Slash Menu：输入 “/” 可插入块
- Block 菜单入口：块级菜单可转换/删除/插入
- 旧演示条已移除（不再出现“标题/列表/输入提示”按钮条）

## 3) 全模块入口一致性（待补）
需验证：overview / truth / timeline / dm / roles / clues 均使用同一 Block Editor 体验，条目切换无 UI 跳变。

## 4) 结论
- 基线回归未回退
- UI 侧 Gate 8.5 验收待人工补充

---

# Milestone 8.5 Gate 验收（编辑器可用性修复期）

验收时间：待补  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 锁定/解锁稳定性
- 复现路径：Truth 输入 → 保存 → 锁定 → 解锁 → 再编辑
- 结果：待补（记录 20 次无崩溃）

## 2) 条目切换稳定性
- 角色/线索各 ≥20 次切换
- 结果：待补（无卡死/无面板失焦）

## 3) 预览一致性
- 预览页展示 Overview 文本，与编辑器一致
- 抽测项目：待补（≥3 个）

## 4) 内联重命名与新增条目
- roles/clues/timeline/dm 各 1 次新增 → 改名 → 刷新一致
- 结果：待补

## 5) 基线回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```
结果摘要：待补（20/20）

---

# Milestone 9 Gate 9 验收（社区中心 V1）

验收时间：2026-01-23 13:53 +08:00  
base_url：https://script-426.pages.dev  
环境：Cloudflare Pages / Production

## 1) 生产 D1 schema 更新
执行：
```powershell
npx wrangler d1 execute script-staging --file=./d1-schema.sql --remote
```
校验：
```powershell
npx wrangler d1 execute script-staging --remote --command "PRAGMA table_info(projects);"
```
结果摘要：`projects` 已包含 `is_public` / `published_at` / `community_summary` / `ai_status` 字段。

## 2) Gate 9 回归（verify-online）
执行：
```powershell
scripts/verify-online.ps1 -BaseUrl "https://script-426.pages.dev"
```

结果摘要：
- POST /api/projects 201（projectId=4dff3878-9e6f-47b3-8e4d-601284174055）
- GET /api/projects/:id 200
- PUT /api/projects/:id/truth 200
- GET /api/projects/:id/issues 200（issues=[]）
- POST /api/projects/:id/publish 200（published=true）
- GET /api/community/projects?sort=latest&q=Smoke 200（包含 projectId）
- PUT /api/community/projects/:id/rating 200（score=5）
- POST /api/community/projects/:id/comments 201（commentId=0e02c968-58a5-4b33-9632-8bc93410bca3, isSuggestion=true）
- POST /api/community/comments/:id/accept 200（accepted=true）
- GET /api/me/notifications（B）包含 suggestion_accepted
- POST /api/projects/:id/unpublish 200
- GET /api/community/projects/:id（owner）200
- GET /api/community/projects/:id（non-owner）404
- stability 20/20 成功（total_time=45.624s）

## 3) 结论
- 社区发布/撤回、评分、评论、采纳与通知链路可用
- 热门/最新列表与搜索可用（Smoke 项可命中）
- 基线回归未回退
