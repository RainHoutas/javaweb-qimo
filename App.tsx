import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './pages/Auth';
import GameList from './pages/GameList';
import GameForm from './pages/GameForm';
import GameDetail from './pages/GameDetail';
import Stats from './pages/Stats';
import { User, AuthContextType } from './types';
import { AuthApi } from './services/api';
import { deleteCookie } from './services/cookie';

// 1. Auth Context Implementation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cyber_token';
const SESSION_ID_KEY = 'cyber_session_id';
const ONLINE_KEY = 'cyber_online_count';
const PRESENCE_KEY = 'cyber_presence_token';
const SKIP_ALERT_KEY = 'cyber_skip_login_alert';
const FIRST_VISIT_KEY = 'cyber_first_visit';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem(SESSION_ID_KEY));

  const registerPresence = () => {
    const existingToken = sessionStorage.getItem(PRESENCE_KEY);
    if (existingToken) return;
    const t = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    sessionStorage.setItem(PRESENCE_KEY, t);
  };

  const removePresence = () => {
    const existingToken = sessionStorage.getItem(PRESENCE_KEY);
    if (!existingToken) return;
    sessionStorage.removeItem(PRESENCE_KEY);
  };

  // Session restore per tab
  useEffect(() => {
    (async () => {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      const storedSession = sessionStorage.getItem(SESSION_ID_KEY);
      if (!storedToken) {
        setIsReady(true);
        return;
      }
      try {
        const res = await AuthApi.me(storedToken, storedSession || undefined);
        setUser(res.user);
        setToken(storedToken);
        setSessionId(res.sessionId || storedSession || null);
        registerPresence();
        setOnlineCount(res.online || 0);
      } catch (_) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(SESSION_ID_KEY);
        setUser(null);
        removePresence();
        setOnlineCount(0);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const login = async (username: string, password: string, remember = false) => {
    const res = await AuthApi.login(username, password, remember);
    setUser(res.user);
    setToken(res.token);
    setSessionId(res.sessionId);
    sessionStorage.setItem(TOKEN_KEY, res.token);
    sessionStorage.setItem(SESSION_ID_KEY, res.sessionId);
    sessionStorage.removeItem('cyber_login_alert');
    registerPresence();
    setOnlineCount(res.online || 0);
  };

  const logout = async () => {
    if (token) await AuthApi.logout(token, sessionId || undefined);
    setUser(null);
    setToken(null);
    setSessionId(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem('cyber_login_alert');
    sessionStorage.setItem(SKIP_ALERT_KEY, '1');
    deleteCookie('cyber_saved_login');
    removePresence();
    setOnlineCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, onlineCount, token, sessionId, login, logout, isAuthenticated: !!user, isReady }}>
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

  if (!isReady) return null;

  if (!isAuthenticated) {
    const first = sessionStorage.getItem(FIRST_VISIT_KEY);
    if (!first) {
      sessionStorage.setItem(FIRST_VISIT_KEY, '1');
      return <Navigate to="/login" state={{ from: location, reason: 'unauthenticated' }} replace />;
    }
    const skip = sessionStorage.getItem(SKIP_ALERT_KEY);
    if (!skip) {
      const already = sessionStorage.getItem('cyber_login_alert');
      if (!already) {
        window.alert('未登录，请先登录后再访问。');
        sessionStorage.setItem('cyber_login_alert', '1');
      }
    }
    return <Navigate to="/login" state={{ from: location, reason: 'unauthenticated' }} replace />;
  }

  return <Layout>{children}</Layout>;
};

// 3. Main Router
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

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
      <Route path="*" element={<Navigate to="/login" replace />} />
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
