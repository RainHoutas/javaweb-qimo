# CyberStore 前后端启动指南

## 前提
- Node.js 20 已安装（你已切换完成）
- 已安装依赖：前端 `npm install`，后端 `cd server && npm install`

## 一键双启动（推荐）
```powershell
cd F:\javaweb-qimo
npm install        # 已安装可跳过
npm run dev:all
```
前端端口 3000，后端端口 5174，浏览器访问 http://localhost:3000/。

## 一键启动（PowerShell 两条命令）
```powershell
# 终端1：后端 API（端口 5174）
cd F:\javaweb-qimo\server
npm run dev

# 终端2：前端（端口 3000，已代理 /api 到 5174）
cd F:\javaweb-qimo
npm run dev
```
浏览器访问 `http://localhost:3000/`。

## WebStorm 运行配置（点运行即可）
1) Run | Edit Configurations… → “+” → npm
   - Name: `server-dev`
   - Package.json: `F:\javaweb-qimo\server\package.json`
   - Command: `run`
   - Scripts: `dev`
   - Working directory: `F:\javaweb-qimo\server`
2) 再建一个 npm 配置
   - Name: `frontend-dev`
   - Package.json: `F:\javaweb-qimo\package.json`
   - Command: `run`
   - Scripts: `dev`
   - Working directory: `F:\javaweb-qimo`
3) 先运行 `server-dev`，再运行 `frontend-dev`，浏览器打开 `http://localhost:3000/`。

## 账号
- 管理员：`admin` / `admin`

## 说明
- 前端端口在 `vite.config.ts`（默认 3000），后端端口与 CORS 在 `server/.env`（默认 5174, CORS_ORIGIN=http://localhost:3000）。
- 如需改端口，修改对应文件并重启服务。
