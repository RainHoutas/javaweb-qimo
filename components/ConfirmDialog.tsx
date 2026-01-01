import React from 'react';
import { Icons } from '../constants';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, type = 'info' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
        {/* Glow Effect */}
        <div className={`absolute top-0 left-0 w-full h-1 ${type === 'danger' ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
        
        <div className="flex items-start mb-4">
          <div className={`p-3 rounded-full mr-4 flex-shrink-0 ${
            type === 'danger' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'
          }`}>
            <Icons.Warning className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-transform active:scale-95 ${
              type === 'danger' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20'
            }`}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
