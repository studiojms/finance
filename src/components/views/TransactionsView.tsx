import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Filter, X } from 'lucide-react';
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
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchTimeFilter: 'all' | 'past' | 'future';
  setSearchTimeFilter: (filter: 'all' | 'past' | 'future') => void;
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
  searchTerm,
  setSearchTerm,
  searchTimeFilter,
  setSearchTimeFilter,
  onToggleConsolidated,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const formatDayName = (date: Date) => {
    const dayName = format(date, 'EEEE', { locale: ptBR }).split('-')[0];
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  };

  const hasActiveFilters = selectedAccountIds.length > 0 || selectedCategoryIds.length > 0 || filterToday || searchTerm;

  return (
    <motion.div
      key="transactions"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 relative"
    >
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-0 top-0 z-50 max-h-[90vh] overflow-y-auto m-4"
            >
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                  aria-label="Fechar filtros"
                >
                  <X size={20} className="text-slate-600" />
                </button>
                <FilterSection
                  title="Extrato"
                  filterToday={filterToday}
                  setFilterToday={setFilterToday}
                  selectedAccountIds={selectedAccountIds}
                  setSelectedAccountIds={setSelectedAccountIds}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  searchTimeFilter={searchTimeFilter}
                  setSearchTimeFilter={setSearchTimeFilter}
                  selectedCategoryIds={selectedCategoryIds}
                  setSelectedCategoryIds={setSelectedCategoryIds}
                  accounts={accounts}
                  categories={categories}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsFilterOpen(true)}
        className={cn(
          'fixed bottom-24 right-4 z-30 p-4 rounded-full shadow-lg transition-all',
          hasActiveFilters
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : 'bg-white hover:bg-slate-50 border-2 border-slate-200'
        )}
        aria-label="Abrir filtros"
      >
        <Filter size={24} className={hasActiveFilters ? 'text-white' : 'text-slate-600'} />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">
              {
                [selectedAccountIds.length > 0, selectedCategoryIds.length > 0, filterToday, searchTerm].filter(Boolean)
                  .length
              }
            </span>
          </span>
        )}
      </button>

      <div className="space-y-6">
        {transactionsByDay.map((group) => (
          <div key={group.date} id={`group-${group.date}`} className="space-y-2">
            <div className="flex items-center gap-2 px-2 pt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {format(parseISO(group.date), "dd 'DE' MMMM", { locale: ptBR })} - {formatDayName(parseISO(group.date))}
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
