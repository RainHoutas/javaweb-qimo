import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GameService } from '../services/mockDatabase';
import { Game } from '../types';
import { Icons } from '../constants';

const GameDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    if (id) {
      const found = GameService.getById(id);
      if (found) setGame(found);
      else navigate('/games');
    }
  }, [id, navigate]);

  if (!game) return null;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <button 
        onClick={() => navigate(`/games?${searchParams.toString()}`)}
        className="flex items-center text-slate-400 hover:text-cyan-400 mb-6 transition-colors text-sm font-medium"
      >
        <Icons.Prev className="w-4 h-4 mr-1" />
        返回游戏库
      </button>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="relative h-64 md:h-80 w-full bg-slate-900">
            {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.name} className="w-full h-full object-cover opacity-60" />
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Icons.Logo className="w-32 h-32 text-slate-500" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-8">
                 <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                    {game.author}
                 </span>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{game.name}</h1>
            </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                        <Icons.View className="w-5 h-5 mr-2 text-cyan-500" />
                        游戏简介
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                        {game.description || "暂无描述。想象一下一场史诗般的冒险正在等待着..."}
                    </p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">系统配置 (模拟)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-slate-500">平台</span>
                            <span className="text-white">PC / Console</span>
                        </div>
                        <div>
                            <span className="block text-slate-500">存储空间</span>
                            <span className="text-white">50 GB 可用空间</span>
                        </div>
                        <div>
                            <span className="block text-slate-500">发布日期</span>
                            <span className="text-white">{game.releaseDate || '2023-01-01'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-1">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 sticky top-6">
                    <div className="text-3xl font-mono font-bold text-cyan-400 mb-6 flex items-center">
                        ${game.price.toFixed(2)}
                    </div>
                    <button className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/25 transition-all mb-3">
                        立即购买
                    </button>
                     <button 
                        onClick={() => navigate(`/games/edit/${game.id}?${searchParams.toString()}`)}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
                        <Icons.Edit className="w-4 h-4 mr-2" />
                        编辑游戏
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;