import { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertCircle } from 'lucide-react';
import { Transaction } from '../../types';
import { cn } from '../../utils';

interface InstallmentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: (mode: 'only' | 'future') => void;
}

export function InstallmentDeleteModal({ isOpen, onClose, transaction, onConfirm }: InstallmentDeleteModalProps) {
  const [deleteMode, setDeleteMode] = useState<'only' | 'future'>('only');

  const handleConfirm = () => {
    onConfirm(deleteMode);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  const isInfinite = transaction.totalInstallments === null;
  const installmentText = transaction.totalInstallments
    ? `${transaction.installmentNumber}/${transaction.totalInstallments}`
    : `#${transaction.installmentNumber}`;
  const typeLabel = isInfinite ? 'Indefinido' : 'Parcelado';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex-1 text-center">Excluir Parcela</h2>
          <div className="w-10"></div>
        </div>

        <div className="space-y-4">
          <div className="bg-rose-50 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-rose-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-rose-900 text-sm">Lançamento {typeLabel}</p>
              <p className="text-rose-700 text-xs mt-1">
                {isInfinite
                  ? `Este lançamento faz parte de uma série indefinida (ocorrência ${installmentText}). Como deseja excluir?`
                  : `Este lançamento é a parcela ${installmentText}. Como deseja excluir?`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                deleteMode === 'only'
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="only"
                checked={deleteMode === 'only'}
                onChange={() => setDeleteMode('only')}
                className="mt-0.5 w-5 h-5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">Apenas esta {isInfinite ? 'ocorrência' : 'parcela'}</p>
                <p className="text-slate-600 text-xs mt-1">
                  {isInfinite
                    ? `Exclui somente esta ocorrência ${installmentText}, mantendo as demais`
                    : `Exclui somente a parcela ${installmentText}, mantendo as demais`}
                </p>
              </div>
            </label>

            <label
              className={cn(
                'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                deleteMode === 'future'
                  ? 'border-emerald-600 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="future"
                checked={deleteMode === 'future'}
                onChange={() => setDeleteMode('future')}
                className="mt-0.5 w-5 h-5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Esta e {isInfinite ? 'ocorrências futuras' : 'parcelas futuras'}
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  {isInfinite
                    ? `Exclui esta ocorrência ${installmentText} e todas as ocorrências futuras (encerra a série)`
                    : `Exclui a parcela ${installmentText} e todas as parcelas seguintes`}
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-[2rem] bg-slate-100 text-slate-700 font-bold transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 rounded-[2rem] bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            Excluir
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
