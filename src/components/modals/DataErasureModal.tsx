import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils';

export type DataErasureMode = 'transactions' | 'transactions-accounts' | 'transactions-categories' | 'all';

interface DataErasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: DataErasureMode) => void;
  isDeleting: boolean;
}

export const DataErasureModal: React.FC<DataErasureModalProps> = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  const [selectedMode, setSelectedMode] = useState<DataErasureMode | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const modes: Array<{ mode: DataErasureMode; title: string; description: string; danger: string }> = [
    {
      mode: 'transactions',
      title: 'Apenas Transações',
      description: 'Remove todas as suas transações',
      danger: 'Contas e categorias serão mantidas',
    },
    {
      mode: 'transactions-accounts',
      title: 'Transações + Contas',
      description: 'Remove todas as transações e contas',
      danger: 'Categorias serão mantidas',
    },
    {
      mode: 'transactions-categories',
      title: 'Transações + Categorias',
      description: 'Remove todas as transações e categorias',
      danger: 'Contas serão mantidas',
    },
    {
      mode: 'all',
      title: 'Tudo',
      description: 'Remove todas as transações, contas e categorias',
      danger: 'Todos os seus dados serão permanentemente excluídos',
    },
  ];

  const handleSelectMode = (mode: DataErasureMode) => {
    setSelectedMode(mode);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (selectedMode) {
      onConfirm(selectedMode);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setSelectedMode(null);
      setShowConfirmation(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {!showConfirmation ? (
              <>
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">Apagar Dados</h3>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    disabled={isDeleting}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-3xl border border-amber-200">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">Atenção!</p>
                      <p className="text-xs text-amber-700">
                        Esta ação é irreversível. Seus dados não poderão ser recuperados após a exclusão.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {modes.map((item) => (
                      <button
                        key={item.mode}
                        onClick={() => handleSelectMode(item.mode)}
                        disabled={isDeleting}
                        className="w-full p-4 bg-white border border-slate-100 rounded-3xl hover:border-rose-200 hover:bg-rose-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                            <p className="text-xs text-rose-600 mt-2 font-medium">{item.danger}</p>
                          </div>
                          <Trash2 size={20} className="text-rose-600 shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Trash2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                  <p className="text-sm text-slate-500 mb-2 leading-relaxed">
                    Você está prestes a excluir dados permanentemente.
                  </p>
                  <p className="text-sm font-bold text-rose-600 mb-8">
                    {modes.find((m) => m.mode === selectedMode)?.danger}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleConfirm}
                      disabled={isDeleting}
                      className={cn(
                        'w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-lg shadow-rose-200 transition-transform',
                        isDeleting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                      )}
                    >
                      {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                    </button>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      disabled={isDeleting}
                      className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
