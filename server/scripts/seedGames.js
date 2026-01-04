import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import 'dotenv/config';

const dbFile = process.env.DB_FILE || './data/app.db';
const seedPath = path.resolve(process.cwd(), '..', 'seed_games.sql');

if (!fs.existsSync(seedPath)) {
  console.error(`未找到 seed 文件: ${seedPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(seedPath, 'utf-8');
const db = new Database(dbFile);
try {
  db.exec(sql);
  console.log('Seed games 写入完成');
} catch (err) {
  console.error('执行 seed 失败:', err.message);
  process.exitCode = 1;
} finally {
  db.close();
}

