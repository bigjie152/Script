# 社区 V1 执行计划（不回退既有闭环）

目标：在不破坏 M0–M8 生产闭环与编辑器内核的前提下，新增社区广场/详情/互动能力。

## 1. 数据模型与迁移
- 扩展 projects 发布字段（isPublic/publishedAt/communitySummary/aiStatusJson）。
- 新增 ratings/comments/likes/favorites/notifications 表。
- D1 迁移：更新 d1-schema.sql + apps/web/lib/schema.ts。

## 2. 后端 API
- 发布/撤回：/api/projects/:id/publish、/unpublish。
- 社区列表/详情：/api/community/projects、/api/community/projects/:id。
- 评分/评论/采纳：/api/community/projects/:id/rating、/comments、/comments/:id/accept。
- 收藏/点赞：/api/community/projects/:id/favorite、/like。
- 通知/个人中心：/api/me/notifications、/api/me/profile。

## 3. 前端页面
- /community：排序、搜索、卡片网格。
- /community/projects/:id：评分、评论、建议采纳、收藏/点赞。
- /me 或 /user/profile：我的作品/收藏/互动/通知。

## 4. 回归与验收
- 扩展 verify-online.ps1/sh 覆盖社区流程。
- 更新 docs/ops/online-acceptance-report.md。
- 更新《Script AI Platform 全链路里程碑管理.md》M9 状态与证据引用。
