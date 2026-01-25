# 前端 MVP 闭环说明（Workspace → Editor）

## 访问路径
- Workspace：`/workspace`
- Editor：`/projects/{id}/editor`

## 交互流程
1) Workspace 点击「新建项目」  
2) 调用 `POST /api/projects` 创建项目  
3) 成功后跳转到 `/projects/{id}/editor`  
4) Editor 拉取项目与 Truth 内容  
5) 编辑文本后点击「保存」  
6) 触发 `PUT /api/projects/{id}/truth`，刷新后仍可读取更新内容  

## 调用的 API
- `POST /api/projects`
- `GET /api/projects/{id}`
- `PUT /api/projects/{id}/truth`
- `GET /api/projects/{id}/issues`（占位，当前返回空数组）

## 线上验收示例（生产域）
> 域名：`https://script-426.pages.dev`

### 1) 创建项目
```
POST /api/projects
HTTP 201
{"project":{"id":"ca0d70c1-a97c-4e8b-924a-f47ebe9530aa","name":"验收项目","description":"MVP验证"},"truth":{"id":"db72e4d8-dc65-40dc-97a0-da7362ad5835","status":"DRAFT"},"projectId":"ca0d70c1-a97c-4e8b-924a-f47ebe9530aa","truthId":"db72e4d8-dc65-40dc-97a0-da7362ad5835","status":"DRAFT"}
```

### 2) 读取项目
```
GET /api/projects/ca0d70c1-a97c-4e8b-924a-f47ebe9530aa
HTTP 200
{"project":{"id":"ca0d70c1-a97c-4e8b-924a-f47ebe9530aa","name":"验收项目","description":"MVP验证","createdAt":"2026-01-16 18:15:22","updatedAt":"2026-01-16 18:15:22"},"truth":{"id":"db72e4d8-dc65-40dc-97a0-da7362ad5835","projectId":"ca0d70c1-a97c-4e8b-924a-f47ebe9530aa","status":"DRAFT","content":{"type":"doc","content":[]},"createdAt":"2026-01-16 18:15:22","updatedAt":"2026-01-16 18:15:22"},"latestSnapshotId":null}
```

### 3) 保存 Truth
```
PUT /api/projects/ca0d70c1-a97c-4e8b-924a-f47ebe9530aa/truth
HTTP 200
{"truthId":"db72e4d8-dc65-40dc-97a0-da7362ad5835","status":"DRAFT"}
```

### 4) 再次读取（验证内容已更新）
```
GET /api/projects/ca0d70c1-a97c-4e8b-924a-f47ebe9530aa
HTTP 200
{"truth":{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"验收更新"}]}]}}}
```

### 5) Issues 占位
```
GET /api/projects/ca0d70c1-a97c-4e8b-924a-f47ebe9530aa/issues
HTTP 200
{"truthSnapshotId":null,"issues":[]}
```

## 备注
- 默认同域 `/api/*`，无需配置 `NEXT_PUBLIC_API_BASE_URL`。
