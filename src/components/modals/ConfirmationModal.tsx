import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-xs bg-white rounded-[2.5rem] shadow-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {message}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 active:scale-95 transition-transform"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
