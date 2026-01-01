import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GameService } from '../services/mockDatabase';
import { Game } from '../types';
import { Icons } from '../constants';

const GameForm: React.FC = () => {
  const { id } = useParams(); // If ID exists, it's Edit mode
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Game>>({
    name: '',
    price: 0,
    author: '',
    coverUrl: '',
    description: '',
    releaseDate: new Date().toISOString().split('T')[0]
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && id) {
      const game = GameService.getById(id);
      if (game) {
        setFormData(game);
        setPreviewUrl(game.coverUrl);
      } else {
        navigate('/games');
      }
    }
  }, [id, isEdit, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) : value
    }));
  };

  // Convert uploaded file to Base64 to store in LocalStorage (Requirement: Image Upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, coverUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing the existing image
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, coverUrl: '' }));
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Cover URL is now optional to allow deletion
    if (!formData.name || !formData.author || formData.price === undefined) {
      alert("名称、作者和价格为必填项。");
      return;
    }

    if (isEdit && id) {
      // Logic: Update
      GameService.update(id, formData);
      alert('游戏更新成功！');
    } else {
      // Logic: Add
      GameService.add(formData as Omit<Game, 'id'>);
      alert('游戏添加成功！');
    }

    // Return to list with params preserved
    navigate(`/games?${searchParams.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
       <button 
        onClick={() => navigate(`/games?${searchParams.toString()}`)}
        className="flex items-center text-slate-400 hover:text-cyan-400 mb-6 transition-colors text-sm font-medium"
      >
        <Icons.Prev className="w-4 h-4 mr-1" />
        取消并返回
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center">
          {isEdit ? <Icons.Edit className="mr-3 text-purple-400"/> : <Icons.Add className="mr-3 text-cyan-400"/>}
          {isEdit ? `编辑 ${formData.name}` : '添加新游戏'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">游戏名称 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
             <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">作者 / 开发商 *</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">价格 ($) *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">发布日期</label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">简介</label>
             <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
             />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">封面图片</label>
            <div className="flex items-start space-x-4">
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-24 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors relative group overflow-visible"
                >
                  {previewUrl ? (
                    <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        <button 
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-opacity opacity-100 z-10"
                            title="删除封面"
                         >
                            <Icons.Delete className="w-3 h-3" />
                         </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 text-center px-2">点击上传</span>
                  )}
               </div>
               <div className="flex-1">
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                 />
                 <p className="text-xs text-slate-500 mb-2">支持: JPG, PNG. 最大 2MB.</p>
                 <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium border border-cyan-500/30 px-3 py-1.5 rounded"
                  >
                    选择文件
                 </button>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end space-x-4">
             <button
                type="button"
                onClick={() => navigate(`/games?${searchParams.toString()}`)}
                className="px-6 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
             >
                取消
             </button>
             <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg shadow-lg shadow-cyan-500/25 font-bold text-sm transform transition-transform hover:scale-105"
             >
                {isEdit ? '保存修改' : '创建游戏'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameForm;