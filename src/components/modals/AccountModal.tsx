import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Banknote,
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Briefcase,
  Coins,
  Receipt,
  CreditCard as CardIcon,
} from 'lucide-react';
import { format, parseISO, isAfter, isEqual } from 'date-fns';
import { doc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Account, Transaction } from '../../types';
import { handleFirestoreError } from '../../services/errorService';
import { cn } from '../../utils';

const ACCOUNT_ICONS = [
  { id: 'Banknote', icon: Banknote },
  { id: 'CreditCard', icon: CreditCard },
  { id: 'Wallet', icon: Wallet },
  { id: 'Landmark', icon: Landmark },
  { id: 'PiggyBank', icon: PiggyBank },
  { id: 'Briefcase', icon: Briefcase },
  { id: 'Coins', icon: Coins },
  { id: 'Receipt', icon: Receipt },
];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editingAccount: Account | null;
  transactions: Transaction[];
}

export function AccountModal({ isOpen, onClose, userId, editingAccount, transactions }: AccountModalProps) {
  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<Account['type']>(editingAccount?.type || 'checking');
  const [balance, setBalance] = useState(editingAccount?.balance.toString() || '');
  const [initialBalance, setInitialBalance] = useState(
    editingAccount?.initialBalance?.toString() || editingAccount?.balance.toString() || '0'
  );
  const [initialBalanceDate, setInitialBalanceDate] = useState(
    editingAccount?.initialBalanceDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [color, setColor] = useState(editingAccount?.color || '#10b981');
  const [icon, setIcon] = useState(editingAccount?.icon || 'Banknote');

  const handleSave = async () => {
    if (!name || !initialBalance) return;
    try {
      const initialBal = parseFloat(initialBalance);

      const accountTransactions = transactions.filter(
        (t) =>
          (t.accountId === editingAccount?.id || t.toAccountId === editingAccount?.id) &&
          t.isConsolidated &&
          (isAfter(parseISO(t.date), parseISO(initialBalanceDate)) ||
            isEqual(parseISO(t.date), parseISO(initialBalanceDate)))
      );

      const transactionsSum = accountTransactions.reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount;
        if (t.type === 'expense') return acc - t.amount;
        if (t.type === 'transfer') {
          if (t.accountId === editingAccount?.id) return acc - t.amount;
          if (t.toAccountId === editingAccount?.id) return acc + t.amount;
        }
        return acc;
      }, 0);

      const currentBalance = initialBal + transactionsSum;

      const data = {
        name,
        type,
        balance: currentBalance,
        initialBalance: initialBal,
        initialBalanceDate,
        color,
        icon,
        userId,
      };

      if (editingAccount) {
        await updateDoc(doc(db, 'accounts', editingAccount.id), data);
      } else {
        await addDoc(collection(db, 'accounts'), data);
      }
    } catch (err) {
      handleFirestoreError(err, editingAccount ? 'update' : 'create', 'accounts');
    } finally {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex-1 text-center">
            {editingAccount ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button onClick={handleSave} className="text-lg font-bold text-emerald-600 transition-colors">
            Salvar
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nome da Conta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="cash">Dinheiro</option>
            <option value="investment">Investimento</option>
          </select>
          <input
            type="number"
            placeholder="Saldo Atual"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold"
          />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
              Saldo Inicial (Base)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Saldo Inicial"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold"
              />
              <input
                type="date"
                value={initialBalanceDate}
                onChange={(e) => setInitialBalanceDate(e.target.value)}
                className="w-40 p-4 bg-slate-50 rounded-2xl font-bold text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Cor</label>
            <div className="flex flex-wrap gap-2 px-2">
              {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2',
                    color === c ? 'border-slate-800' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Ícone</label>
            <div className="grid grid-cols-4 gap-2 px-2">
              {ACCOUNT_ICONS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setIcon(id)}
                  className={cn(
                    'p-3 rounded-2xl flex items-center justify-center transition-all',
                    icon === id ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  )}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
