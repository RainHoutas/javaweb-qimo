import React from 'react';
import { useAuth } from '../App';
import { Icons } from '../constants';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, onlineCount } = useAuth();
  const location = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-cyber-dark text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Icons.Logo className="w-8 h-8 text-cyan-400 mr-3" />
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            CyberStore
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center">
              <Icons.User className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link 
              to="/games" 
              className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 group ${
                isActive('/games') 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icons.Logo className="w-5 h-5 mr-3" />
              游戏中心
            </Link>
            <Link 
              to="/stats" 
              className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 group ${
                isActive('/stats') 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icons.Chart className="w-5 h-5 mr-3" />
              数据分析
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
           <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-2">
             <div className="flex items-center">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
               在线人数
             </div>
             <span className="font-mono text-cyan-500">{onlineCount}</span>
           </div>
          <button 
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors"
          >
            <Icons.Logout className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-cyber-dark to-black">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] -z-10 bg-[center_top_-1px]"></div>
        <div className="container mx-auto p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
