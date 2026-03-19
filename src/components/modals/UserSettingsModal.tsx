import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Calendar, LogOut } from 'lucide-react';
import { cn } from '../../utils';
import { AuthUser } from '../../services/authService';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  includePreviousBalance: boolean;
  setIncludePreviousBalance: (value: boolean) => void;
  transactionSortOrder: 'asc' | 'desc';
  setTransactionSortOrder: (value: (prev: 'asc' | 'desc') => 'asc' | 'desc') => void;
  onLogout: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  includePreviousBalance,
  setIncludePreviousBalance,
  transactionSortOrder,
  setTransactionSortOrder,
  onLogout,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Configurações</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden border-2 border-emerald-500">
                  <img src={user?.photoURL || ''} alt={user?.displayName || ''} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{user?.displayName}</h4>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                  Preferências de Exibição
                </h5>

                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Saldo Retroativo</p>
                      <p className="text-[10px] text-slate-400">Incluir saldo de meses anteriores no extrato</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIncludePreviousBalance(!includePreviousBalance)}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      includePreviousBalance ? 'bg-emerald-600' : 'bg-slate-200'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                        includePreviousBalance ? 'right-1' : 'left-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Ordem do Extrato</p>
                      <p className="text-[10px] text-slate-400">
                        {transactionSortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTransactionSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition-colors"
                  >
                    Alterar
                  </button>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-4 bg-rose-50 text-rose-600 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
              >
                <LogOut size={20} />
                Sair da Conta
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
