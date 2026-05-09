# CyberStore 项目技术说明

本文用中文概述前后端主要逻辑、页面与功能对应关系，以及关键实现细节，便于快速理解和维护。

## 技术栈
- 前端：React + TypeScript + Vite（HashRouter），UI 基于 Tailwind 风格的自定义样式。
- 后端：Node.js + Express，SQLite（better-sqlite3）。
- 身份：JWT 存于前端 `sessionStorage`，后端用中间件校验；会话心跳存 SQLite `sessions` 表，用于在线人数。

## 路由与页面对应
- `/login` → `pages/Auth.tsx`：登录/注册页，支持“记住登录”（保存账号密码到 cookie `cyber_saved_login`）。
- `/games` → `pages/GameList.tsx`：游戏列表，筛选/分页/滚动视图、导出 Excel、查看详情、管理员可删/改/加。
- `/games/add` → `pages/GameForm.tsx`：新增游戏（仅管理员）。
- `/games/edit/:id` → `pages/GameForm.tsx`：编辑游戏（仅管理员）。
- `/games/detail/:id` → `pages/GameDetail.tsx`：游戏详情，管理员可跳转编辑。
- `/stats` → `pages/Stats.tsx`：简单统计（按作者计数、总估值）。

所有受保护路由都包装在 `App.tsx` 中的 `ProtectedRoute` 组件，未登录会跳转 `/login` 并弹出“未登录”提醒（每次会话只提醒一次，相关标记存 `sessionStorage`）。

## 认证与会话
- 前端 `App.tsx` 中的 `AuthProvider` 负责：
  - 登录：调用 `/api/login`，保存 `token` 与 `sessionId` 到 `sessionStorage`，并在上下文提供 `user`、`token`、`sessionId`、`onlineCount`。
  - 恢复登录：页面刷新时用已有 `token/sessionId` 调用 `/api/me`，成功则还原用户与在线人数。
  - 登出：调用 `/api/logout` 删除服务器会话，清空本地 token、sessionId、记住登录 cookie，并设置一次性的“跳过未登录提醒”标记。
- 后端 `server/app.js`：
  - `POST /api/login`：校验密码（bcrypt），签发 JWT；调用 `touchSession(userId)` 在 `sessions` 表写入一条心跳记录；返回 `token`、`sessionId`、`online`。
  - `GET /api/me`：校验 JWT；若带 `x-session-id` 则刷新 `last_seen`，否则补一条新 session；返回用户与在线人数。
  - `POST /api/logout`：删除对应 `sessionId` 记录。
  - `countOnline()`：`cleanupSessions()` 先删除超过 `SESSION_TTL_MS` 未活跃的会话（默认 5 分钟），再按 `DISTINCT user_id` 统计。

## 游戏数据 API
- `GET /api/games`：列表。
- `GET /api/games/:id`：详情。
- `POST /api/games`：新增，管理员权限。
- `PUT /api/games/:id`：修改，管理员权限。
- `DELETE /api/games/:id`：删除，管理员权限。
- 数据表结构见 `server/db.js`（自动建表、初始化 admin 账号/密码：admin/admin）。

## 前端页面关键实现
- `pages/GameList.tsx`
  - 筛选：名称、作者、价格区间；条件与视图模式写入 URL，便于刷新/分享保持状态。
  - 视图：分页模式（默认，每页 `ITEMS_PER_PAGE`）或滚动全览；分页参数同步到 URL。
  - 导出：`xlsx` 把筛选后的数据导出为 Excel。
  - 操作：详情跳转、编辑/删除前管理员校验；删除成功后自动刷新并处理分页边界。
  - 封面：缺省时显示占位图标。
- `pages/GameForm.tsx`
  - 新增/编辑共用：根据是否有 `id` 判断模式。
  - 表单校验：名称/作者/价格必填，新建必须上传封面（Base64 存储）；编辑可移除封面。
  - 文件上传：`FileReader` 转 Base64 预览与提交。
  - 仅管理员可访问（进入时检查，非管理员直接提示并跳回列表）。
- `pages/GameDetail.tsx`
  - 展示封面、作者、价格、简介；管理员可跳转编辑。
- `pages/Auth.tsx`
  - 登录/注册切换；记住登录使用 cookie `cyber_saved_login`（保存 7 天）。
- `pages/Stats.tsx`
  - 使用 recharts 绘制作者游戏数量柱状图；展示总估值。
- `components/Layout.tsx`
  - 侧边栏显示用户信息、在线人数、导航与退出按钮；主体区域渲染当前受保护页面。

## 在线人数与多端
- 在线人数显示为服务端 `countOnline()` 结果（按 `sessions.user_id` 去重）。
- 同一用户多个 session 视为 1 人；`SESSION_TTL_MS` 过期自动清理，默认 5 分钟无心跳即下线。
- 前端刷新 `/api/me` 会刷新对应 session 心跳；若不带 `x-session-id` 会新建一条。

## 记住登录与未登录提示
- 记住登录：登录时勾选会把账号密码存入 cookie，重新进入登录页自动填充并勾选。
- 未登录访问受保护路由：`ProtectedRoute` 首次访问会弹窗并重定向登录；当前会话只提示一次（标记在 `sessionStorage`）。登出后设置 `SKIP_ALERT_KEY` 避免立刻再次提示。

## 权限控制
- 管理员判定：`user.role === 'admin'`。
- 前端：新增/编辑/删除按钮前判断；非管理员弹窗提示。
- 后端：对应写、改、删接口使用 `authMiddleware` 校验 JWT 后检查 `role`，不满足返回 403。

## 数据与脚本
- 数据库文件：`server/data/app.db`。
- 初始化：`server/db.js` 自动建表并创建 admin/admin。
- 填充游戏：`server/scripts/seedGames.js` 会读取项目根目录 `seed_games.sql` 执行 SQL（需先安装 better-sqlite3）。

## 常见排查点
- 在线人数异常偏高：可能残留 `sessions` 记录；用 `DELETE FROM sessions;` 清空后重启，确保前端带上 `x-session-id` 刷新心跳。
- 401/403：确认前端 `token` 与 `sessionId` 是否在 `sessionStorage`，请求头是否带 `Authorization`/`x-session-id`；确认登录用户是否 admin。
- 本地封面 Base64：存入 DB；体积过大会撑大 DB，生产应改为对象存储或文件服务。

以上涵盖主要底层逻辑与实现路径，可按需补充运维/部署细节。

