import React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { Account } from '../../types';
import { IconRenderer } from '../IconRenderer';

interface AccountsViewProps {
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onAddAccount: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
}) => {
  return (
    <motion.div 
      key="accounts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold text-slate-800">Minhas Contas</h2>
      <div className="grid gap-4">
        {accounts.map(account => (
          <div 
            key={account.id} 
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: account.color }}>
                <IconRenderer iconName={account.icon || (account.type === 'credit_card' ? 'CreditCard' : 'Banknote')} size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{account.name}</h4>
                <p className="text-xs text-slate-400 capitalize">{account.type.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-lg text-slate-900">{formatCurrency(account.balance)}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => onEditAccount(account)}
                  className="p-2 text-slate-400 hover:text-emerald-500"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => onDeleteAccount(account)}
                  className="p-2 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={onAddAccount}
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-2 mb-20"
        >
          <Plus size={20} />
          Adicionar Conta
        </button>
      </div>
    </motion.div>
  );
};
