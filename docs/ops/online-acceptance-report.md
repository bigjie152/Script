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
