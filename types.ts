export interface User {
  id: string;
  username: string;
  password?: string; // Only used during auth check, usually not stored in frontend state securely
  role: 'admin' | 'user';
}

export interface Game {
  id: string;
  name: string;
  price: number;
  author: string;
  coverUrl: string;
  description?: string;
  releaseDate: string;
}

export interface GameFilterParams {
  name: string;
  author: string;
  minPrice: string;
  maxPrice: string;
  page: number;
}

export interface AuthContextType {
  user: User | null;
  onlineCount: number;
  login: (username: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
