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

// 1. Auth Context Implementation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(1); // Default to 1 (current user)

  // NOTE: Previous simulation of random users removed per user request. 
  // In a real app, this would use a WebSocket or polling to get the actual server-side session count.
  // For this local demo, "1" represents the current active user.

  // Check storage for persisted session (simple implementation)
  useEffect(() => {
    const storedUser = localStorage.getItem('cyber_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string) => {
    // In a real app, we'd fetch the full user object securely
    const allUsers = UserService.getAll();
    const found = allUsers.find(u => u.username === username);
    if (found) {
      const safeUser = { ...found }; 
      delete safeUser.password;
      setUser(safeUser);
      localStorage.setItem('cyber_current_user', JSON.stringify(safeUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cyber_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, onlineCount, login, logout, isAuthenticated: !!user }}>
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
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
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