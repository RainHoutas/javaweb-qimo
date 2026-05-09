import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GameApi } from '../services/api';
import { Game } from '../types';
import { Icons, ITEMS_PER_PAGE } from '../constants';
import ConfirmDialog from '../components/ConfirmDialog';
import { utils, writeFile } from 'xlsx';
import { useAuth } from '../App';

const GameList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, sessionId, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // 从 URL 参数初始化筛选条件
  const [nameFilter, setNameFilter] = useState(searchParams.get('name') || '');
  const [authorFilter, setAuthorFilter] = useState(searchParams.get('author') || '');
  // 价格区间状态
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  
  const [games, setGames] = useState<Game[]>([]);
  
  // 对话框状态
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  
  // 视图模式：分页视图 pagination 或滚动视图 scroll
  // 修复：从 URL 初始化以便导航后保持模式
  const [viewMode, setViewMode] = useState<'pagination' | 'scroll'>((searchParams.get('view') as 'pagination' | 'scroll') || 'pagination');

  // 当筛选条件变化时同步到 URL
  useEffect(() => {
    const params: any = {};
    if (nameFilter) params.name = nameFilter;
    if (authorFilter) params.author = authorFilter;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    
    // 修复：将视图模式写入 URL
    params.view = viewMode;

    // 仅在分页模式下同步页码
    if (viewMode === 'pagination') {
        const currentPage = searchParams.get('page') || '1';
        params.page = currentPage;
    }
    setSearchParams(params, { replace: true });
  }, [nameFilter, authorFilter, minPrice, maxPrice, setSearchParams, viewMode]);

  const refreshGames = async () => {
    const list = await GameApi.list(token || undefined, sessionId || undefined);
    setGames(list);
  };

  useEffect(() => {
    refreshGames();
  }, []);

  // 过滤逻辑
  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchName = g.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchAuthor = g.author.toLowerCase().includes(authorFilter.toLowerCase());
      
      // 价格区间逻辑
      const priceVal = g.price;
      const min = minPrice !== '' ? parseFloat(minPrice) : 0;
      const max = maxPrice !== '' ? parseFloat(maxPrice) : Infinity;
      const matchPrice = priceVal >= min && priceVal <= max;

      return matchName && matchAuthor && matchPrice;
    });
  }, [games, nameFilter, authorFilter, minPrice, maxPrice]);

  // 分页逻辑
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
  const paginatedGames = filteredGames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    const params = Object.fromEntries(searchParams);
    params.page = newPage.toString();
    setSearchParams(params);
  };

  // 根据视图模式决定展示的游戏数据
  const gamesToShow = viewMode === 'pagination' ? paginatedGames : filteredGames;

  // 操作
  const handleEditClick = (id: string) => {
    setEditId(id); // 打开对话框而不是立即导航
  };

  const confirmEdit = () => {
    if (editId) {
      if (!isAdmin) {
        alert('权限不足：只有管理员可以编辑游戏。');
        setEditId(null);
        return;
      }
      const params = new URLSearchParams(searchParams);
      navigate(`/games/edit/${editId}?${params.toString()}`);
      setEditId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (!isAdmin) {
      alert('权限不足：只有管理员可以删除游戏。');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await GameApi.remove(deleteId, token || undefined, sessionId || undefined);
        await refreshGames();
        setDeleteId(null);
        if (viewMode === 'pagination' && paginatedGames.length === 1 && currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
        alert('游戏删除成功。');
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (msg.includes('403')) {
          alert('权限不足：只有管理员可以删除游戏。');
        } else {
          alert(`删除失败：${msg}`);
        }
      }
    }
  };

  const handleExport = () => {
    // 1. 为 Excel 准备数据映射
    const exportData = filteredGames.map(game => ({
      "游戏ID": game.id,
      "游戏名称": game.name,
      "作者/开发商": game.author,
      "价格": game.price,
      "发布日期": game.releaseDate,
      "简介": game.description || "无"
    }));

    // 2. 创建工作表
    const ws = utils.json_to_sheet(exportData);

    // 3. 创建工作簿并追加工作表
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "游戏列表");

    // 4. 触发下载
    writeFile(wb, `CyberStore_Export_${Date.now()}.xlsx`);
  };

  // 当前待编辑的游戏，用于弹窗显示名称
  const gameToEdit = games.find(g => g.id === editId);

  return (
    <div className="space-y-6">
      {/* 顶部与操作区域 */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">游戏库</h1>
          <p className="text-slate-400 text-sm mt-1">管理您的数字库存</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* 视图切换 */}
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 mr-2">
            <button
              onClick={() => setViewMode('pagination')}
              className={`p-2 rounded-md transition-all flex items-center space-x-2 ${viewMode === 'pagination' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="分页列表"
            >
              <Icons.List className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">分页显示</span>
            </button>
            <button
              onClick={() => setViewMode('scroll')}
              className={`p-2 rounded-md transition-all flex items-center space-x-2 ${viewMode === 'scroll' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              title="滑动全览 (垂直滚动)"
            >
              <Icons.Grid className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">滑动全览</span>
            </button>
          </div>

          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors text-sm font-medium"
          >
            <Icons.Export className="w-4 h-4 mr-2" />
            导出 Excel
          </button>
          <button 
            onClick={() => {
              if (!isAdmin) {
                alert('权限不足：只有管理员可以添加游戏。');
                return;
              }
              navigate(`/games/add?${searchParams.toString()}`);
            }}
            className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 transition-all text-sm font-bold"
          >
            <Icons.Add className="w-4 h-4 mr-2" />
            添加游戏
          </button>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索名称..."
            value={nameFilter}
            onChange={(e) => {
                setNameFilter(e.target.value);
                if(viewMode === 'pagination') handlePageChange(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Icons.User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索作者..."
            value={authorFilter}
            onChange={(e) => {
                setAuthorFilter(e.target.value);
                if(viewMode === 'pagination') handlePageChange(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
        {/* 价格区间筛选 */}
        <div className="flex items-center space-x-2">
           <div className="relative flex-1">
             <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
             <input
               type="number"
               placeholder="最低价"
               value={minPrice}
               onChange={(e) => {
                   setMinPrice(e.target.value);
                   if(viewMode === 'pagination') handlePageChange(1);
               }}
               className="w-full pl-7 pr-2 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
             />
           </div>
           <span className="text-slate-500 font-bold">-</span>
           <div className="relative flex-1">
             <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
             <input
               type="number"
               placeholder="最高价"
               value={maxPrice}
               onChange={(e) => {
                   setMaxPrice(e.target.value);
                   if(viewMode === 'pagination') handlePageChange(1);
               }}
               className="w-full pl-7 pr-2 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder-slate-500"
             />
           </div>
        </div>
      </div>

      {/* 统一表格视图 */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden animate-in fade-in duration-300 flex flex-col">
        {/* 表格容器 */}
        <div className={`${
            viewMode === 'scroll' 
                ? 'overflow-y-auto h-[600px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900' 
                : 'overflow-x-auto'
        }`}>
          <table className="w-full text-left text-sm text-slate-400">
            {/* 仅在滚动模式下吸顶表头 */}
            <thead className={`bg-slate-800/80 text-xs uppercase font-medium text-slate-300 ${
                viewMode === 'scroll' ? 'sticky top-0 z-10 backdrop-blur-md shadow-sm' : ''
            }`}>
              <tr>
                <th className="px-6 py-4">封面</th>
                <th className="px-6 py-4">游戏名称</th>
                <th className="px-6 py-4">作者</th>
                <th className="px-6 py-4">价格</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {gamesToShow.length > 0 ? (
                gamesToShow.map((game) => (
                  <tr key={game.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-12 w-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 relative group">
                        {game.coverUrl ? (
                            <img src={game.coverUrl} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <Icons.Logo className="w-6 h-6 text-slate-600" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Icons.View className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{game.name}</td>
                    <td className="px-6 py-4">{game.author}</td>
                    <td className="px-6 py-4 text-cyan-400 font-mono">${game.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                            onClick={() => navigate(`/games/detail/${game.id}?${searchParams.toString()}`)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" 
                            title="详情">
                            <Icons.View className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleEditClick(game.id)}
                            className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors border border-cyan-500/20"
                            title="编辑">
                            <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(game.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20" 
                            title="删除">
                            <Icons.Delete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        没有找到符合条件的游戏。
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分页模式下的分页控制 */}
        {viewMode === 'pagination' && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/30">
                <span className="text-xs text-slate-500">
                    第 <span className="text-white font-medium">{currentPage}</span> 页 / 共 <span className="text-white font-medium">{totalPages}</span> 页
                </span>
                <div className="flex space-x-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-50 hover:text-white transition-colors"
                    >
                        <Icons.Prev className="w-4 h-4" />
                    </button>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 disabled:opacity-50 hover:text-white transition-colors"
                    >
                        <Icons.Next className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        {/* 滚动模式下的页脚说明 */}
        {viewMode === 'scroll' && (
             <div className="px-6 py-2 bg-slate-900/30 border-t border-slate-800 text-xs text-center text-slate-500">
                已加载所有 {filteredGames.length} 款游戏（垂直滚动查看更多）
             </div>
        )}
      </div>

      {/* 编辑确认弹窗 */}
      <ConfirmDialog
        isOpen={!!editId}
        title="确认修改"
        message={`是否确认修改 ${gameToEdit?.name || '该游戏'}?`}
        onConfirm={confirmEdit}
        onCancel={() => setEditId(null)}
        type="info"
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="删除游戏"
        message="您确定要从商店中永久删除此游戏吗？此操作无法撤销。"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        type="danger"
      />
    </div>
  );
};

export default GameList;

