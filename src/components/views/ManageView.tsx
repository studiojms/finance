import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import { Account, Category, Transaction } from '../../types';
import { AccountsView } from './AccountsView';
import { CategoriesView } from './CategoriesView';

interface ManageViewProps {
  // Accounts
  accounts: Account[];
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (account: Account) => void;
  onAddAccount: () => void;

  // Categories
  categories: Category[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddCategory: () => void;
}

export const ManageView: React.FC<ManageViewProps> = ({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onAddAccount,
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'categories'>('accounts');

  return (
    <motion.div
      key="manage"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="sticky top-0 z-10 bg-slate-50 pb-4 -mx-4 px-4 pt-0">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={cn(
              'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
              activeSubTab === 'accounts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            )}
          >
            Contas
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={cn(
              'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
              activeSubTab === 'categories' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            )}
          >
            Categorias
          </button>
        </div>
      </div>

      {activeSubTab === 'accounts' && (
        <AccountsView
          accounts={accounts}
          onEditAccount={onEditAccount}
          onDeleteAccount={onDeleteAccount}
          onAddAccount={onAddAccount}
        />
      )}

      {activeSubTab === 'categories' && (
        <CategoriesView
          categories={categories}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddCategory={onAddCategory}
        />
      )}
    </motion.div>
  );
};
