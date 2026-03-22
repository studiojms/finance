import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpCircle, ArrowDownCircle, Plus, Calendar } from 'lucide-react';
import { FilterSection } from '../FilterSection';
import { TransactionItem } from '../TransactionItem';
import { formatCurrency } from '../../utils';
import { Account, Transaction, Category } from '../../types';
import { IconRenderer } from '../IconRenderer';

interface DashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  filteredTransactions: Transaction[];
  upcomingTransactions: Transaction[];
  totals: { income: number; expense: number; balance: number };
  totalBalance: number;
  selectedAccountIds: string[];
  setSelectedAccountIds: (ids: string[]) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (ids: string[]) => void;
  filterToday: boolean;
  setFilterToday: (val: boolean) => void;
  onToggleConsolidated: (t: Transaction) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (t: Transaction) => void;
  setActiveTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  categories,
  filteredTransactions,
  upcomingTransactions,
  totals,
  selectedAccountIds,
  setSelectedAccountIds,
  selectedCategoryIds,
  setSelectedCategoryIds,
  filterToday,
  setFilterToday,
  onToggleConsolidated,
  onEditTransaction,
  onDeleteTransaction,
  setActiveTab,
}) => {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <FilterSection
        title="Visão Geral"
        filterToday={filterToday}
        setFilterToday={setFilterToday}
        selectedAccountIds={selectedAccountIds}
        setSelectedAccountIds={setSelectedAccountIds}
        selectedCategoryIds={selectedCategoryIds}
        setSelectedCategoryIds={setSelectedCategoryIds}
        accounts={accounts}
        categories={categories}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ArrowUpCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Entradas</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.income)}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <ArrowDownCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Saídas</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.expense)}</p>
        </div>
      </div>

      {/* Accounts Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Minhas Contas</h3>
          <button onClick={() => setActiveTab('accounts')} className="text-emerald-600 text-sm font-bold">
            Ver todas
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {(selectedAccountIds.length === 0 ? accounts : accounts.filter((a) => selectedAccountIds.includes(a.id))).map(
            (account) => (
              <div
                key={account.id}
                className="min-w-[160px] p-4 rounded-3xl text-white shadow-md"
                style={{ backgroundColor: account.color }}
              >
                <div className="flex justify-between items-start mb-4">
                  <IconRenderer
                    iconName={account.icon || (account.type === 'credit_card' ? 'CreditCard' : 'Banknote')}
                    size={20}
                  />
                </div>
                <p className="text-xs opacity-80 mb-1">{account.name}</p>
                <p className="font-bold text-lg">{formatCurrency(account.balance)}</p>
              </div>
            )
          )}
          {accounts.length === 0 && (
            <button
              onClick={() => setActiveTab('accounts')}
              className="min-w-[160px] p-4 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2"
            >
              <Plus size={24} />
              <span className="text-xs font-bold">Nova Conta</span>
            </button>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Lançamentos Recentes</h3>
          <button onClick={() => setActiveTab('transactions')} className="text-emerald-600 text-sm font-bold">
            Ver extrato
          </button>
        </div>
        <div className="space-y-3">
          {filteredTransactions.slice(0, 5).map((t) => (
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
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="mx-auto mb-2 opacity-20" size={48} />
              <p className="text-sm">Nenhum lançamento encontrado.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Transactions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Próximos Lançamentos</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Próximos dias</span>
        </div>
        <div className="space-y-3">
          {upcomingTransactions.map((t) => (
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
          {upcomingTransactions.length === 0 && (
            <div className="text-center py-8 text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-100">
              <Calendar className="mx-auto mb-2 opacity-10" size={40} />
              <p className="text-xs">Tudo em dia! Nenhum lançamento futuro.</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
};
