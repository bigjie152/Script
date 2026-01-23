# Community V1 设计说明

## 目标
- 提供社区广场、作品详情、评分/评论/建议/采纳、收藏/点赞、通知的最小可用闭环。
- 公开作品可被任何人浏览；互动必须登录。
- 不破坏既有编辑器与 API 契约。

## 数据模型（D1）
- projects：新增 `is_public`、`published_at`、`community_summary`、`ai_status`。
- ratings：单用户单作品一票制（覆盖更新）。
- comments：两级树（parentId 为主评论；禁止再套一层）。
- favorites / likes：收藏与点赞。
- notifications：建议采纳等通知。

## 评分显示分（贝叶斯）
显示分 = (R * v + C * m) / (v + m)
- R：作品平均分
- v：作品评分人数
- C：全站平均分（无评分时默认 3.6）
- m：平滑系数（默认 10）

## 接口一览
- 发布/撤回：
  - POST `/api/projects/:id/publish`
  - POST `/api/projects/:id/unpublish`
- 社区列表：
  - GET `/api/community/projects?sort=latest|hot&q=&genre=&author=`
- 社区详情：
  - GET `/api/community/projects/:id`
- 评分：
  - PUT `/api/community/projects/:id/rating {score}`
- 评论：
  - POST `/api/community/projects/:id/comments {content,isSuggestion,parentId?}`
  - PUT `/api/community/comments/:id {content}`
  - DELETE `/api/community/comments/:id`
  - POST `/api/community/comments/:id/accept`
- 收藏/点赞：
  - PUT `/api/community/projects/:id/favorite {on}`
  - PUT `/api/community/projects/:id/like {on}`
- 用户中心：
  - GET `/api/me/profile`
  - GET `/api/me/notifications`
  - PUT `/api/me/notifications/read {ids?}`

## 权限规则
- 未登录：仅可浏览公开作品；不可评分/评论/收藏/点赞。
- 未公开作品：非 owner 访问返回 404。
- 评论删除为静默删除（列表不再返回）。
- 建议采纳仅 owner 可操作，并生成通知。

## 热门排序权重（当前实现）
hotScore = displayScore * 3 + likes * 2 + comments * 1.5 + favorites

## 前端页面
- `/community`：广场列表（最新/热门 + 搜索）。
- `/community/projects/:id`：作品详情、评分、评论、建议、收藏/点赞。
- `/user/profile`：我的发布作品 / 收藏 / 互动 / 通知。
