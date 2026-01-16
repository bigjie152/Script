# 前端启动说明（V0.1）

## 环境要求
- Node.js 18+
- npm 9+

## 本地启动
```bash
cd apps/web
npm install
```

设置 API 基础地址（推荐指向线上 API，以避免本地 D1 绑定问题）：
```bash
# macOS / Linux
export NEXT_PUBLIC_API_BASE_URL=https://script-426.pages.dev

# Windows PowerShell
$env:NEXT_PUBLIC_API_BASE_URL="https://script-426.pages.dev"
```

启动前端：
```bash
npm run dev
```

访问：
- http://localhost:3000/workspace

## 连接本地后端（可选）
```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 注意事项
- 本地后端需要 D1 binding（`DB`）才能创建项目；若未配置，请直接使用线上 API 作为开发后端。
- 如需本地后端，请确保 `apps/api` 按 D1 方式启动或通过 Wrangler 提供绑定。

## 说明
- Workspace 列表目前为静态占位，真实可用按钮：**新建项目**
- 真实闭环：新建项目 → 进入编辑器 → Truth 保存 → 锁定 → 派生角色 → 一致性检查 → 问题列表
