# packages/prompts

## 用途/职责
Prompt 库（Prompt as Code），沉淀可复用的提示词模板与版本。Prompt 是可审计的代码资产，不允许 inline。

## 包含内容
- truth/：真相生成与修订 Prompt（generate/revise）
- derive/：派生类 Prompt（role/clue/timeline/dm）
- check/：一致性检查 Prompt（consistency）
- index.ts：对外入口（占位）

## 与其它目录的依赖关系
- 被依赖方：`/packages/ai-orchestrator`。
- 禁止依赖：任何代码模块（Prompt 仅作为静态资源）。

## 禁止事项
- 在 orchestrator 或应用层编写 inline Prompt。
- 使用未版本化的 Prompt 文件替换旧版本。
- Prompt 内容与 Domain 约束冲突或绕过一致性要求。

## 常见变更场景
- 新增 v2：在相同目录新增 `*.v2.md`，保留 v1 并记录差异。
- 修订 Prompt：以新版本替代，禁止覆盖历史。
- 对齐一致性检查：修改 check/ 下规则并同步 orchestrator 引用。

## 命名规范/约定
- Prompt 文件使用 `name.vN.md` 版本号格式（如 `generate.v1.md`）。
- 目录名反映用途（truth/derive/check），不可混用。
- 版本号与 orchestrator 的引用保持一致。

## 测试/验证原则
- Prompt 变更需验证与 Domain 规则一致、输出可被一致性检查覆盖。
- 评估关注输入边界、异常输出与可追溯性。