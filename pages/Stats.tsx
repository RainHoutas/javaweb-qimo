import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { GameService } from '../services/mockDatabase';

// Requirements: Use recharts.
const Stats: React.FC = () => {
  const games = GameService.getAll();

  // Prepare data: Count games per author
  const authorData = Object.values(games.reduce((acc: any, game) => {
    if (!acc[game.author]) acc[game.author] = { name: game.author, count: 0 };
    acc[game.author].count++;
    return acc;
  }, {}));

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-white mb-6">平台数据分析</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
             <h2 className="text-lg font-semibold text-cyan-400 mb-4">各开发商游戏数量</h2>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={authorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ color: '#22d3ee' }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col justify-center items-center">
             <h2 className="text-lg font-semibold text-purple-400 mb-2">总估值</h2>
             <p className="text-4xl font-mono font-bold text-white mb-2">
               ${games.reduce((sum, g) => sum + g.price, 0).toFixed(2)}
             </p>
             <p className="text-slate-500 text-sm">商店目录总价值</p>
          </div>
       </div>
    </div>
  );
};

export default Stats;
