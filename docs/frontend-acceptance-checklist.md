# 前端本地验收清单（V0.1）

验收时间：2026-01-16 17:29:00 +08:00  
前端端口：3000  
API Base：`https://script-426.pages.dev`（本地后端未提供 D1 binding）  

## 1) 运行与页面可用性

- `npm install`：通过  
- `npm run dev`：通过（frontend ready）  
- `/workspace`：HTTP 200  
- `/`：HTTP 307（重定向到 /workspace）  

## 2) 最小闭环（基于线上 API）

1. Workspace 页面可打开  
2. 新建项目（API）：`POST /api/projects` → 201  
3. Overview：`GET /api/projects/{id}` → 200  
4. Truth 保存：`PUT /api/projects/{id}/truth` → 200  
5. Lock Truth：`POST /api/projects/{id}/truth/lock` → 200  
6. 生成角色：`POST /api/projects/{id}/ai/derive/roles` → 200  
7. 一致性检查：`POST /api/projects/{id}/ai/check/consistency` → 200  
8. Issues 列表：`GET /api/projects/{id}/issues` → 200  

## 3) 稳定性回归（创建 + 读取 20 次）

- 成功：20  
- 失败：0  
- 总耗时：15.140s  

## 4) 发现的问题与处理

- 本地后端未配置 D1 binding 时，创建项目返回 `DB binding not found`。  
  处理方式：前端开发时通过 `NEXT_PUBLIC_API_BASE_URL` 指向线上 API；若需本地后端，需按 D1 方式启动后端服务。

## 5) 可演示路径

打开 `/workspace` → 新建项目 → 进入 `/projects/{id}/editor/overview` → 切换到 `truth` → 保存 → 锁定 → 生成角色 → 一致性检查 → 问题列表查看 issues

---

## 6) 线上复验（部署后）

复验时间：2026-01-16 17:33:03 +08:00  
Base URL：`https://script-426.pages.dev`  

- health / workflow 全部通过  
- 稳定性回归（20 次创建 + 读取）：成功 20，失败 0，总耗时 23.807s  
