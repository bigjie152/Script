# 编辑器 M8.5 交互说明

目标：在不改变既有三栏布局与数据协议的前提下，强化编辑器的可用性与交互一致性。

## 1) 侧栏嵌套导航
- Roles / Clues / Timeline / DM 为父节点，可折叠（默认折叠，当前模块自动展开）。
- 子条目点击切换内容，不影响右侧面板。
- “+ 添加…” 新增条目后自动进入内联重命名。

## 2) 内联重命名
- 点击“重命名”后，条目名称变为输入框。
- Enter 保存、Esc 取消、失焦保存或取消。
- 删除操作使用内联确认，不使用浏览器弹窗。

## 3) Truth 锁定/解锁
- 锁定后编辑区只读，解锁可恢复编辑。
- 解锁采用内联确认（不使用浏览器 confirm）。
- 锁定/解锁过程中编辑器不卸载，避免 DOM 错误。

## 4) 预览页一致性
- /projects/{id}/preview 展示 Overview 文档内容。
- Overview 为空时显示 project.description 或“暂无简介”。

## 5) Debug 开关
- 设置 `NEXT_PUBLIC_EDITOR_DEBUG=true` 开启调试日志：
  - editor create/destroy
  - suggestion start/exit
  - 模块/条目切换上下文
