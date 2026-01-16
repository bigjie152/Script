# docs

## 用途/职责
项目知识与协作文档集合，包含需求、架构、规范与决策记录，是团队协作的“维护手册”。

## 包含内容
- `README.md`：文档体系说明与维护规范
- `api.yaml`：V0.1 API 契约（OpenAPI）
- `frontend-design.md`：前端实现规范（设计与工程约定）
- `frontend-integration.md`：前端对接清单
- `frontend-run.md`：前端启动与开发说明
- `cloudflare-deploy.md`：Cloudflare staging 部署说明
- 其他文档：以 Markdown 文件形式存放于 docs/ 根目录（按主题命名）

## 与其它目录的依赖关系
- 允许依赖：对 `apps`、`packages`、`infra` 的说明与引用
- 禁止依赖：任何运行时代码或配置实现

## 禁止事项
- 文档内容与真实目录结构不一致
- 在文档中固化未版本化的 Prompt 或业务规则细节

## 常见变更场景
- 新增规范：在 docs/ 新增 Markdown 文件，并在本 README 中补充入口
- 更新架构：记录变更原因与影响范围，确保与依赖边界一致
- 变更接口：同步更新 `api.yaml` 与根 README 的对接入口

## 命名规范/约定
- 文档标题清晰、可检索；必要时添加版本号或日期
- 文件名使用英文小写加短横线，避免含糊缩写

## 测试/验证原则
- 文档更新需与代码边界一致，避免“文档漂移”
- 变更后检查根 README 的导航与入口链接
