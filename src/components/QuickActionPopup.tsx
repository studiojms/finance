import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { TransactionType } from '../types';

interface QuickActionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: TransactionType) => void;
}

export const QuickActionPopup: React.FC<QuickActionPopupProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Novo Lançamento</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => onSelect('expense')}
                className="flex items-center gap-4 p-5 bg-rose-50 hover:bg-rose-100 rounded-3xl transition-colors group"
              >
                <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 group-active:scale-90 transition-transform">
                  <ArrowDownCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-rose-900">Despesa</p>
                  <p className="text-xs text-rose-600/60">Registrar uma saída de dinheiro</p>
                </div>
              </button>

              <button 
                onClick={() => onSelect('income')}
                className="flex items-center gap-4 p-5 bg-emerald-50 hover:bg-emerald-100 rounded-3xl transition-colors group"
              >
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-active:scale-90 transition-transform">
                  <ArrowUpCircle size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-emerald-900">Receita</p>
                  <p className="text-xs text-emerald-600/60">Registrar uma entrada de dinheiro</p>
                </div>
              </button>

              <button 
                onClick={() => onSelect('transfer')}
                className="flex items-center gap-4 p-5 bg-violet-50 hover:bg-violet-100 rounded-3xl transition-colors group"
              >
                <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200 group-active:scale-90 transition-transform">
                  <TrendingUp size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-violet-900">Transferência</p>
                  <p className="text-xs text-violet-600/60">Mover dinheiro entre contas</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
