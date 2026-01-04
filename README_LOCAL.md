# CyberStore 本地启动与架构说明

## 项目栈与端口
- 前端：Vite + React（端口默认 3000，见 `vite.config.ts`）
- 后端：Express + SQLite（端口默认 5174，见 `server/.env`）
- Auth：Bearer Token + `x-session-id`（每标签独立），后端 `sessions` 表统计在线人数（5 分钟心跳过期，可调 `SESSION_TTL_MS`）

## 一键双启动（推荐）
```powershell
cd F:\javaweb-qimo
npm install        # 如已安装可跳过
npm run dev:all    # 同时启动前后端：前端 3000，后端 5174
```
访问：http://localhost:3000/

## 手动启动
```powershell
# 后端（终端1）
cd F:\javaweb-qimo\server
npm install    # 首次或依赖更新后
npm run dev    # API 监听 5174

# 前端（终端2）
cd F:\javaweb-qimo
npm install    # 首次或依赖更新后
npm run dev    # 前端 3000，代理 /api -> 5174
```

## WebStorm 运行配置
1) Run | Edit Configurations… → “+” → npm
   - Name: `server-dev`
   - package.json: `F:\javaweb-qimo\server\package.json`
   - Command: `run`  Scripts: `dev`  Workdir: `F:\javaweb-qimo\server`
2) 再建 `frontend-dev`
   - package.json: `F:\javaweb-qimo\package.json`
   - Command: `run`  Scripts: `dev`  Workdir: `F:\javaweb-qimo`
3) 先跑 `server-dev`，再跑 `frontend-dev`，打开 http://localhost:3000/

## 账号
- 管理员：`admin` / `admin`

## 登录与在线人数机制
- 登录：前端将 token + sessionId 存到 `sessionStorage`（每标签独立），请求带 `Authorization: Bearer <token>` 与 `x-session-id`。
- 记住我：仅用于预填账号密码（`cyber_saved_login` Cookie）；退出会清理。
- 在线人数：后端 `sessions` 表按用户去重计数，默认 5 分钟无心跳自动过期；`/api/me` 会刷新心跳。
- 同浏览器多标签可登录不同账号互不覆盖；跨浏览器/设备会共用后端在线计数。

## 常见问题
- “依旧显示在线/未退出”：删除缓存后刷新，如仍有问题，调用 `/api/online` 看返回值，并重启后端（清理会话）。
- `EBADENGINE` 警告：Node 版本低于建议（需 20.19+），可升级：`nvm install 20.19.0 && nvm use 20.19.0`。
- better-sqlite3 编译失败：需 VS C++ Build Tools，或使用已安装的 Node 20 LTS 后重新 `npm install`。

## 配置参数（`server/.env`）
- `PORT`：后端端口，默认 5174
- `CORS_ORIGIN`：前端地址，默认 http://localhost:3000
- `SESSION_TTL_MS`：会话过期（毫秒），默认 300000（5 分钟）
- 其余见文件注释

## 数据库
- SQLite 文件：`server/data/app.db`
- 初始种子：管理员 admin/admin，会自动创建 `users`、`games`、`sessions` 表
- 若需重置数据：停止后端，删除 `server/data/app.db`，重启后端自动重建
