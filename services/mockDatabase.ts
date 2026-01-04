import { Game, User } from '../types';

const USERS_KEY = 'cyberstore_users';
const GAMES_KEY = 'cyberstore_games';

// Seed Initial Data if empty or update default admin
const seedData = () => {
  // 1. Handle Users Logic
  let users: User[] = [];
  try {
    const stored = localStorage.getItem(USERS_KEY);
    users = stored ? JSON.parse(stored) : [];
  } catch (e) {
    users = [];
  }

  // Check if admin exists
  const adminIndex = users.findIndex(u => u.username === 'admin');
  if (adminIndex !== -1) {
    // If admin exists, force update password to 'admin' to meet current requirement
    users[adminIndex].password = 'admin';
  } else {
    // If admin does not exist, create it
    const admin: User = { id: '1', username: 'admin', password: 'admin', role: 'admin' };
    users.push(admin);
  }
  // Save back to storage
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // 2. Handle Games Logic
  if (!localStorage.getItem(GAMES_KEY)) {
    const initialGames: Game[] = [
      { id: '1', name: 'Cyberpunk 2077', price: 59.99, author: 'CDPR', coverUrl: 'https://picsum.photos/seed/cyber/400/300', description: '开放世界动作冒险 RPG，发生在一个痴迷于权力、魅力和身体改造的巨型都市中。', releaseDate: '2020-12-10' },
      { id: '2', name: 'Elden Ring', price: 59.99, author: 'FromSoft', coverUrl: 'https://picsum.photos/seed/elden/400/300', description: '备受赞誉的奇幻动作 RPG，在广阔的世界中展开史诗般的冒险。', releaseDate: '2022-02-25' },
      { id: '3', name: 'Hades', price: 24.99, author: 'Supergiant', coverUrl: 'https://picsum.photos/seed/hades/400/300', description: '肉鸽（Roguelike）动作游戏，挑战奥林匹斯众神，逃离冥界。', releaseDate: '2020-09-17' },
      { id: '4', name: 'Minecraft', price: 29.99, author: 'Mojang', coverUrl: 'https://picsum.photos/seed/mine/400/300', description: '关于放置积木和进行冒险的沙盒游戏。', releaseDate: '2011-11-18' },
      { id: '5', name: 'Stardew Valley', price: 14.99, author: 'ConcernedApe', coverUrl: 'https://picsum.photos/seed/star/400/300', description: '轻松的农场模拟游戏，继承祖父的旧农场，开始新生活。', releaseDate: '2016-02-26' },
      { id: '6', name: 'Hollow Knight', price: 14.99, author: 'Team Cherry', coverUrl: 'https://picsum.photos/seed/hollow/400/300', description: '史诗般的动作冒险游戏，穿越一个庞大而荒废的昆虫王国。', releaseDate: '2017-02-24' },
    ];
    localStorage.setItem(GAMES_KEY, JSON.stringify(initialGames));
  }
};

seedData();

export const UserService = {
  getAll: () => [],
  register: () => false,
  login: () => null
};

export const GameService = {
  getAll: () => [],
  add: () => undefined,
  update: () => undefined,
  delete: () => undefined,
  getById: () => undefined
};