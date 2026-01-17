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
