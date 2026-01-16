# 前端对接清单（V0.1）
本清单用于前端与后端对接时的调用时机与数据依赖梳理，不包含 UI 实现细节。

## 项目工作台（Project Workspace）
- 初始化：当前无 `GET /api/projects` 列表接口，V0.1 用静态占位或本地 mock
- 新建项目：`POST /api/projects`（创建成功后跳转编辑器）
- 需要的数据：projectId、truthId、status

> 待补：后续需要补 `GET /api/projects` 列表接口（仅记录需求，不改后端）

## Truth 编辑页（Editor / Truth）
- 初始化：`GET /api/projects/{id}` 拉取当前 Truth（DRAFT/LOCKED）
- 保存草稿：`PUT /api/projects/{id}/truth`
- 锁定 Truth：`POST /api/projects/{id}/truth/lock`
- 需要的数据：truth.content、truth.status、truthId

## 角色派生面板（AI Panel / Roles）
- 触发派生：`POST /api/projects/{id}/ai/derive/roles`
- 触发时机：Truth 已锁定后，用户点击“生成角色”
- 需要的数据：truthSnapshotId（可传，默认最新）

## 一致性检查（Issue 面板）
- 触发检查：`POST /api/projects/{id}/ai/check/consistency`
- 拉取结果：`GET /api/projects/{id}/issues`
- 触发时机：Truth 已锁定后，用户点击“一致性检查”
- 需要的数据：truthSnapshotId（可传，默认最新）

## 社区反馈（Community）
- 提交反馈：`POST /api/projects/{id}/community/feedback`
- 查看反馈：`GET /api/projects/{id}/community/feedback`
- 触发时机：用户进入反馈列表或提交建议

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