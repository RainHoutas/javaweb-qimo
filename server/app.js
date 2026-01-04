import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const REMEMBER_MAX = Number(process.env.COOKIE_MAX_AGE_REMEMBER) || 7 * 24 * 3600 * 1000;
const SESSION_MAX = Number(process.env.COOKIE_MAX_AGE_SESSION) || 24 * 3600 * 1000;
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS) || 5 * 60 * 1000; // 5分钟内有心跳算在线

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const signToken = (payload, remember) =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: remember ? '7d' : '1d' });

const authMiddleware = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return res.sendStatus(401);
  const token = auth.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.token = token;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};

const touchSession = (userId) => {
  const now = Date.now();
  const sessionId = uuidv4();
  db.prepare('INSERT OR REPLACE INTO sessions (id, user_id, last_seen, created_at) VALUES (?,?,?,?)')
    .run(sessionId, userId, now, now);
  return sessionId;
};

const refreshSession = (sessionId) => {
  const now = Date.now();
  db.prepare('UPDATE sessions SET last_seen=? WHERE id=?').run(now, sessionId);
};

const cleanupSessions = () => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  db.prepare('DELETE FROM sessions WHERE last_seen < ?').run(cutoff);
};

const countOnline = () => {
  cleanupSessions();
  const row = db.prepare('SELECT COUNT(DISTINCT user_id) as cnt FROM sessions').get();
  return row?.cnt || 0;
};

// Auth routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: '缺少字段' });
  const exists = db.prepare('SELECT 1 FROM users WHERE username=?').get(username);
  if (exists) return res.status(409).json({ message: '用户已存在' });
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?,?,?)')
    .run(username, hash, 'user');
  return res.sendStatus(201);
});

app.post('/api/login', (req, res) => {
  const { username, password, remember } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user) return res.status(401).json({ message: '用户名或密码错误' });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: '用户名或密码错误' });
  const token = signToken({ id: user.id, username: user.username, role: user.role }, remember);
  const sessionId = touchSession(user.id);
  res.json({ user: { id: user.id, username: user.username, role: user.role }, token, sessionId, online: countOnline() });
});

app.post('/api/logout', authMiddleware, (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) db.prepare('DELETE FROM sessions WHERE id=?').run(sessionId);
  res.sendStatus(204);
});

app.get('/api/me', authMiddleware, (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId) refreshSession(sessionId); else touchSession(req.user.id);
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role }, online: countOnline(), sessionId });
});

app.get('/api/online', (_req, res) => {
  res.json({ online: countOnline() });
});

// Games
app.get('/api/games', (_req, res) => {
  const list = db.prepare('SELECT id, name, price, author, cover_url as coverUrl, description, release_date as releaseDate FROM games ORDER BY id DESC').all();
  res.json(list);
});

app.get('/api/games/:id', (req, res) => {
  const g = db.prepare('SELECT id, name, price, author, cover_url as coverUrl, description, release_date as releaseDate FROM games WHERE id=?').get(req.params.id);
  if (!g) return res.sendStatus(404);
  res.json(g);
});

app.post('/api/games', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, price, author, coverUrl, description, releaseDate } = req.body || {};
  if (!name || price === undefined || !author) return res.status(400).json({ message: '缺少必填字段' });
  const stmt = db.prepare('INSERT INTO games (name, price, author, cover_url, description, release_date) VALUES (?,?,?,?,?,?)');
  const info = stmt.run(name, price, author, coverUrl, description, releaseDate);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.put('/api/games/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, price, author, coverUrl, description, releaseDate } = req.body || {};
  db.prepare('UPDATE games SET name=?, price=?, author=?, cover_url=?, description=?, release_date=? WHERE id=?')
    .run(name, price, author, coverUrl, description, releaseDate, req.params.id);
  res.sendStatus(204);
});

app.delete('/api/games/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.prepare('DELETE FROM games WHERE id=?').run(req.params.id);
  res.sendStatus(204);
});

const port = process.env.PORT || 5174;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

