import React, { useState } from 'react';
import { useAuth } from '../App';
import { UserService } from '../services/mockDatabase';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../constants';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('用户名和密码不能为空。');
      return;
    }

    if (isLogin) {
      const user = UserService.login(formData.username, formData.password);
      if (user) {
        login(user.username);
        navigate('/games');
      } else {
        setError('用户名或密码错误。');
      }
    } else {
      // Register
      if (UserService.register({ username: formData.username, password: formData.password, role: 'user' })) {
        setSuccess('注册成功！正在跳转至登录页...');
        setTimeout(() => setIsLogin(true), 1500);
      } else {
        setError('用户名已存在，无法注册。');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050511] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 mb-4 shadow-lg shadow-cyan-500/25">
                <Icons.Logo className="w-8 h-8 text-white" />
            </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? '欢迎回来' : '加入我们'}
          </h1>
          <p className="text-slate-400 text-sm">
            {isLogin ? '输入您的凭证以访问系统。' : '创建账户，开始收集您的游戏。'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400 text-sm">
            <Icons.Error className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center text-green-400 text-sm">
            <Icons.Success className="w-4 h-4 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">用户名</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">密码</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {isLogin && (
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-offset-slate-900 focus:ring-cyan-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400">
                记住密码
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-95"
          >
            {isLogin ? '登录' : '注册账户'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-700/50 pt-6">
          <p className="text-slate-400 text-sm">
            {isLogin ? "还没有账号？ " : "已经有账号了？ "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
