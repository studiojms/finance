import React from 'react';
import { motion } from 'motion/react';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { FilterSection } from '../FilterSection';
import { TransactionItem } from '../TransactionItem';
import { formatCurrency, cn } from '../../utils';
import { Account, Transaction, Category } from '../../types';

interface TransactionsViewProps {
  transactionsByDay: {
    date: string;
    transactions: Transaction[];
    dayTotal: number;
    runningBalance: number;
  }[];
  categories: Category[];
  accounts: Account[];
  selectedAccountIds: string[];
  setSelectedAccountIds: (ids: string[]) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  filterToday: boolean;
  setFilterToday: (val: boolean) => void;
  onToggleConsolidated: (t: Transaction) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactionsByDay,
  categories,
  accounts,
  selectedAccountIds,
  setSelectedAccountIds,
  selectedCategoryIds,
  setSelectedCategoryIds,
  filterToday,
  setFilterToday,
  onToggleConsolidated,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  return (
    <motion.div
      key="transactions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <FilterSection
        title="Extrato"
        filterToday={filterToday}
        setFilterToday={setFilterToday}
        selectedAccountIds={selectedAccountIds}
        setSelectedAccountIds={setSelectedAccountIds}
        selectedCategoryIds={selectedCategoryIds}
        setSelectedCategoryIds={setSelectedCategoryIds}
        accounts={accounts}
        categories={categories}
      />

      <div className="space-y-6">
        {transactionsByDay.map((group) => (
          <div key={group.date} id={`group-${group.date}`} className="space-y-2">
            <div className="flex items-center gap-2 px-2 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {format(parseISO(group.date), "dd 'DE' MMMM", { locale: ptBR })}
              </span>
              {isToday(parseISO(group.date)) && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-lg">
                  HOJE
                </span>
              )}
            </div>

            <div className="space-y-2">
              {group.transactions.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  category={categories.find((c) => c.id === t.categoryId)}
                  account={accounts.find((a) => a.id === t.accountId)}
                  onToggle={() => onToggleConsolidated(t)}
                  onEdit={() => onEditTransaction(t)}
                  onDelete={() => onDeleteTransaction(t)}
                />
              ))}
            </div>

            <div className="flex justify-end px-4 py-1 bg-slate-50/50 rounded-xl border border-slate-100/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total parcial:</span>
                <span
                  className={cn('text-xs font-black', group.runningBalance >= 0 ? 'text-emerald-600' : 'text-rose-600')}
                >
                  {group.runningBalance > 0 ? '+' : ''}
                  {formatCurrency(group.runningBalance)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {transactionsByDay.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="mx-auto mb-2 opacity-20" size={48} />
            <p className="text-sm">Nenhum lançamento encontrado.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
