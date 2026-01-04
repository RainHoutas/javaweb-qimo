# CyberStore 后端 (Express + SQLite)

## 环境
- Node.js 18+
- SQLite 随 Node 直接使用（better-sqlite3）

## 配置
编辑 `server/.env`：
```
PORT=5174
JWT_SECRET=change_me
DB_FILE=./data/app.db
COOKIE_NAME=auth_token
COOKIE_MAX_AGE_REMEMBER=604800000
COOKIE_MAX_AGE_SESSION=86400000
CORS_ORIGIN=http://localhost:3000
```

## 安装与运行
```powershell
cd server
npm install
npm run dev   # nodemon
# 或
npm start     # 生产模式
```

启动后 API 地址：`http://localhost:5174/api`

## 路由
- POST /api/register {username,password}
- POST /api/login {username,password,remember}
- POST /api/logout
- GET  /api/me
- GET  /api/games
- GET  /api/games/:id
- POST /api/games         (admin)
- PUT  /api/games/:id      (admin)
- DELETE /api/games/:id    (admin)

## 种子
启动时自动创建 admin 账户（密码 admin）。

