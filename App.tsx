import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './pages/Auth';
import GameList from './pages/GameList';
import GameForm from './pages/GameForm';
import GameDetail from './pages/GameDetail';
import Stats from './pages/Stats';
import { User, AuthContextType } from './types';
import { UserService } from './services/mockDatabase';
import { setCookie, getCookie, deleteCookie } from './services/cookie';

// 1. Auth Context Implementation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ONLINE_KEY = 'cyber_online_count';
const PRESENCE_KEY = 'cyber_presence_token';
const SKIP_ALERT_KEY = 'cyber_skip_login_alert';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(() => {
    const stored = Number(localStorage.getItem(ONLINE_KEY) || '0');
    return Number.isFinite(stored) ? stored : 0;
  });

  const updateOnlineStorage = (delta: number) => {
    const current = Number(localStorage.getItem(ONLINE_KEY) || '0');
    const next = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);
    localStorage.setItem(ONLINE_KEY, String(next));
    setOnlineCount(next);
  };

  const registerPresence = () => {
    const existingToken = sessionStorage.getItem(PRESENCE_KEY);
    if (existingToken) return; // Already counted for this tab
    const token = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    sessionStorage.setItem(PRESENCE_KEY, token);
    updateOnlineStorage(1);
  };

  const removePresence = () => {
    const existingToken = sessionStorage.getItem(PRESENCE_KEY);
    if (!existingToken) return;
    sessionStorage.removeItem(PRESENCE_KEY);
    updateOnlineStorage(-1);
  };

  // NOTE: Previous simulation of random users removed per user request. 
  // In a real app, this would use a WebSocket or polling to get the actual server-side session count.
  // For this local demo, "1" represents the current active user.

  // Check cookie for persisted session
  useEffect(() => {
    const storedUser = getCookie('cyber_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      registerPresence();
    }
    setIsReady(true);
  }, []);

  // Sync online count across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === ONLINE_KEY && e.newValue) {
        const next = Number(e.newValue);
        if (Number.isFinite(next)) setOnlineCount(next);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Remove presence on tab close/refresh if logged in
  useEffect(() => {
    const onUnload = () => {
      if (sessionStorage.getItem(PRESENCE_KEY)) {
        removePresence();
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const login = (username: string, remember = false) => {
    // In a real app, we'd fetch the full user object securely
    const allUsers = UserService.getAll();
    const found = allUsers.find(u => u.username === username);
    if (found) {
      const safeUser = { ...found }; 
      delete safeUser.password;
      setUser(safeUser);
      sessionStorage.removeItem('cyber_login_alert');
      // Remember flag controls cookie expiry (defaults to session cookie)
      setCookie('cyber_current_user', JSON.stringify(safeUser), remember ? 7 : undefined);
      registerPresence();
    }
  };

  const logout = () => {
    setUser(null);
    deleteCookie('cyber_current_user');
    sessionStorage.removeItem('cyber_login_alert');
    sessionStorage.setItem(SKIP_ALERT_KEY, '1');
    removePresence();
  };

  return (
    <AuthContext.Provider value={{ user, onlineCount, login, logout, isAuthenticated: !!user, isReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// 2. Protected Route Component (Filter Implementation)
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return null; // Avoid flashing redirect/alert before auth is restored
  }

  if (!isAuthenticated) {
    const skip = sessionStorage.getItem(SKIP_ALERT_KEY);
    if (skip) {
      return <Navigate to="/login" state={{ from: location, reason: 'unauthenticated' }} replace />;
    }
    const already = sessionStorage.getItem('cyber_login_alert');
    if (!already) {
      window.alert('未登录，请先登录后再访问。');
      sessionStorage.setItem('cyber_login_alert', '1');
    }
    // Redirect to login with reason, no popup to avoid double alerts in StrictMode
    return <Navigate to="/login" state={{ from: location, reason: 'unauthenticated' }} replace />;
  }

  return <Layout>{children}</Layout>;
};

// 3. Main Router
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      
      {/* Protected Routes */}
      <Route path="/games" element={
        <ProtectedRoute>
          <GameList />
        </ProtectedRoute>
      } />
      
      <Route path="/games/add" element={
        <ProtectedRoute>
          <GameForm />
        </ProtectedRoute>
      } />
      
      <Route path="/games/edit/:id" element={
        <ProtectedRoute>
          <GameForm />
        </ProtectedRoute>
      } />

      <Route path="/games/detail/:id" element={
        <ProtectedRoute>
          <GameDetail />
        </ProtectedRoute>
      } />
      
       <Route path="/stats" element={
        <ProtectedRoute>
          <Stats />
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/games" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
