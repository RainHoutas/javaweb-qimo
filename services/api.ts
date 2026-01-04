import { Game, User } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string, sessionId?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sessionId) headers['x-session-id'] = sessionId;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText);
  }
  try {
    return (await res.json()) as T;
  } catch (_) {
    return undefined as unknown as T;
  }
}

export const AuthApi = {
  login: (username: string, password: string, remember: boolean) =>
    request<{ user: User; token: string; sessionId: string; online: number }>('/login', { method: 'POST', body: JSON.stringify({ username, password, remember }) }),
  register: (username: string, password: string) =>
    request<void>('/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: (token?: string, sessionId?: string) => request<void>('/logout', { method: 'POST' }, token, sessionId),
  me: (token?: string, sessionId?: string) => request<{ user: User; online: number; sessionId?: string }>('/me', { method: 'GET' }, token, sessionId),
  online: () => request<{ online: number }>('/online', { method: 'GET' }),
};

export const GameApi = {
  list: (token?: string, sessionId?: string) => request<Game[]>('/games', { method: 'GET' }, token, sessionId),
  get: (id: string, token?: string, sessionId?: string) => request<Game>(`/games/${id}`, { method: 'GET' }, token, sessionId),
  add: (payload: Omit<Game, 'id'>, token?: string, sessionId?: string) => request<{ id: number }>(`/games`, { method: 'POST', body: JSON.stringify(payload) }, token, sessionId),
  update: (id: string, payload: Partial<Game>, token?: string, sessionId?: string) => request<void>(`/games/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, token, sessionId),
  remove: (id: string, token?: string, sessionId?: string) => request<void>(`/games/${id}`, { method: 'DELETE' }, token, sessionId),
};
