# 前端对接清单（V0.1）

本清单用于前端与后端对接时的调用时机与数据依赖梳理，不包含任何 UI 实现细节。

## 项目工作台（Project Workspace）
- 初始化：`GET /api/projects/{id}` 获取项目概要、Truth 状态与最新快照
- 新建项目：`POST /api/projects`（首次进入时创建）
- 需要的数据：project、truth、latestSnapshotId

## Truth 编辑页（Editor）
- 初始化：`GET /api/projects/{id}` 拉取当前 Truth（DRAFT/LOCKED）
- 保存草稿：`PUT /api/projects/{id}/truth`（编辑器保存/手动点击保存）
- 锁定 Truth：`POST /api/projects/{id}/truth/lock`（点击“锁定/冻结”时）
- 需要的数据：truth.content、truth.status、truthId

## 角色派生面板（AI Panel / Roles）
- 触发派生：`POST /api/projects/{id}/ai/derive/roles`
- 触发时机：Truth 已锁定后，用户点击“派生角色”
- 需要的数据：truthSnapshotId（可传，默认最新）

## 一致性检查（Issue 面板）
- 触发检查：`POST /api/projects/{id}/ai/check/consistency`
- 拉取结果：`GET /api/projects/{id}/issues`
- 触发时机：Truth 已锁定后，用户点击“一致性检查”
- 需要的数据：truthSnapshotId（可传，默认最新）

## 社区反馈（Community）
- 提交反馈：`POST /api/projects/{id}/community/feedback`
- 查看反馈：`GET /api/projects/{id}/community/feedback`
- 触发时机：用户提交/进入反馈列表

## 统一错误返回
所有接口统一返回：
```json
{
  "error": {
    "message": "string",
    "details": null
  }
}
```
