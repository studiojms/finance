import React, { useState, useEffect } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import {
  LayoutDashboard,
  ArrowUpCircle,
  Wallet,
  PieChart as PieChartIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Database,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { format, addMonths, isToday, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, cn, getPieData } from './utils';
import { Transaction } from './types';
import { AccountModal } from './components/modals/AccountModal';
import { TransactionModal } from './components/modals/TransactionModal';
import { NavButton } from './components/NavButton';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { InstallmentDeleteModal } from './components/modals/InstallmentDeleteModal';
import { QuickActionPopup } from './components/QuickActionPopup';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { Login } from './components/Login';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { ManageView } from './components/views/ManageView';
import { ChartsView } from './components/views/ChartsView';
import { DataView } from './components/views/DataView';
import { CategoryModal } from './components/modals/CategoryModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAuth } from './hooks/useAuth';
import { useFirestoreData } from './hooks/useFirestoreData';
import { useTransactionOperations } from './hooks/useTransactionOperations';
import { useCSVImport } from './hooks/useCSVImport';
import { useTransactionCalculations } from './hooks/useTransactionCalculations';
import { useModalState } from './hooks/useModalState';
import { CSVService } from './services/csvService';
import { APP_CONFIG } from './config';

// --- Components ---

export default function App() {
  const { user, loading, signOut: handleLogout } = useAuth();
  const { accounts, transactions, categories } = useFirestoreData(user?.uid || null);
  const { toggleConsolidated, deleteTransaction } = useTransactionOperations(transactions);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'charts' | 'data'>(
    'dashboard'
  );

  const exportToCSV = () => {
    const blob = CSVService.exportToCSV(transactions, categories, accounts);
    CSVService.downloadCSV(blob);
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [filterToday, setFilterToday] = useState(false);

  // Modal state management
  const modalState = useModalState();

  // Helper function to handle transaction deletion
  const handleDeleteTransaction = (transaction: Transaction) => {
    if (transaction.installmentId) {
      modalState.openInstallmentDelete(transaction, (mode) => {
        deleteTransaction(transaction, mode);
      });
    } else {
      modalState.openConfirm(
        'Excluir Lançamento',
        'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
        () => deleteTransaction(transaction)
      );
    }
  };

  const extratoRef = React.useRef<HTMLDivElement>(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);

  const [includePreviousBalance, setIncludePreviousBalance] = useState(() => {
    const saved = localStorage.getItem('includePreviousBalance');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [transactionSortOrder, setTransactionSortOrder] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('transactionSortOrder');
    return (saved as 'asc' | 'desc') || 'desc';
  });

  // Transaction calculations
  const { filteredTransactions, totals, totalBalance, upcomingTransactions, transactionsByDay, pieChartData } =
    useTransactionCalculations({
      transactions,
      accounts,
      categories,
      currentMonth,
      selectedAccountIds,
      selectedCategoryIds,
      filterToday,
      includePreviousBalance,
      transactionSortOrder,
    });

  const { isImporting, importProgress, importStatus, importError, importFromCSV } = useCSVImport(
    user?.uid || '',
    accounts,
    categories
  );

  useEffect(() => {
    localStorage.setItem('includePreviousBalance', JSON.stringify(includePreviousBalance));
  }, [includePreviousBalance]);

  // Reset scroll flag when month changes
  useEffect(() => {
    setHasScrolledToToday(false);
  }, [currentMonth]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to today's transactions
  useEffect(() => {
    if (activeTab === 'transactions' && !hasScrolledToToday && transactionsByDay.length > 0) {
      const todayGroup = transactionsByDay.find((g) => isToday(parseISO(g.date)));
      if (todayGroup) {
        const element = document.getElementById(`group-${todayGroup.date}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHasScrolledToToday(true);
        }
      }
    }
  }, [activeTab, transactionsByDay, hasScrolledToToday]);

  // Handlers are now provided by hooks

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;

  // Check for backend misconfiguration
  const isFirebase = APP_CONFIG.backend === 'firebase';
  const isSupabase = APP_CONFIG.backend === 'supabase';
  const hasFirebaseConfig = !!APP_CONFIG.firebase.apiKey;
  const hasSupabaseConfig = !!(APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey);

  if ((isFirebase && !hasFirebaseConfig) || (isSupabase && !hasSupabaseConfig)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Configuration Error</h1>
            <p className="text-slate-600">Backend authentication is not properly configured</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-slate-800 mb-3">Current Configuration:</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded">VITE_BACKEND</span>
                <span className="text-slate-600">=</span>
                <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {APP_CONFIG.backend}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-600">Firebase configured:</span>
                <span className={`font-bold ${hasFirebaseConfig ? 'text-green-600' : 'text-red-600'}`}>
                  {hasFirebaseConfig ? '✓ Yes' : '✗ No'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-600">Supabase configured:</span>
                <span className={`font-bold ${hasSupabaseConfig ? 'text-green-600' : 'text-red-600'}`}>
                  {hasSupabaseConfig ? '✓ Yes' : '✗ No'}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h2 className="font-bold text-yellow-800 mb-3">How to Fix:</h2>
            <div className="space-y-4 text-sm text-yellow-900">
              <div>
                <p className="font-semibold mb-2">
                  Option 1: Use Supabase (recommended if you have Supabase credentials)
                </p>
                <p className="mb-2">
                  Add to your <code className="bg-yellow-100 px-2 py-1 rounded">.env</code> file:
                </p>
                <pre className="bg-yellow-900 text-yellow-100 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                  VITE_BACKEND=supabase{'\n'}
                  VITE_SUPABASE_URL=your_supabase_url{'\n'}
                  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
                </pre>
              </div>

              <div>
                <p className="font-semibold mb-2">Option 2: Use Firebase</p>
                <p className="mb-2">
                  Add to your <code className="bg-yellow-100 px-2 py-1 rounded">.env</code> file:
                </p>
                <pre className="bg-yellow-900 text-yellow-100 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                  VITE_BACKEND=firebase{'\n'}
                  VITE_FIREBASE_API_KEY=your_api_key{'\n'}
                  VITE_FIREBASE_AUTH_DOMAIN=your_domain{'\n'}
                  VITE_FIREBASE_PROJECT_ID=your_project_id{'\n'}
                  ...
                </pre>
              </div>

              <p className="text-xs text-yellow-700 mt-4">
                💡 After updating .env, restart your dev server for changes to take effect.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 pt-8 pb-6 landscape:pt-4 landscape:pb-4 rounded-b-[2.5rem] landscape:rounded-b-[1.5rem] shadow-lg transition-all">
        <div className="flex justify-between items-center mb-6 landscape:mb-2">
          <button
            onClick={modalState.openSettings}
            className="flex items-center gap-3 text-left hover:bg-white/10 p-1 rounded-2xl transition-colors"
          >
            <div className="w-10 h-10 landscape:w-8 landscape:h-8 rounded-full bg-emerald-500/50 flex items-center justify-center overflow-hidden border-2 border-emerald-400">
              <img src={user.photoURL || ''} alt={user.displayName || ''} referrerPolicy="no-referrer" />
            </div>
            <div className="landscape:hidden sm:block">
              <div className="flex items-center gap-1.5">
                <p className="text-emerald-100 text-xs">Olá, {user.displayName?.split(' ')[0]}</p>
                {!isOnline && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" title="Offline" />
                )}
              </div>
              <h2 className="font-bold text-lg">Visão Geral</h2>
            </div>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                'p-2 rounded-full transition-colors',
                activeTab === 'data' ? 'bg-white text-emerald-600' : 'hover:bg-emerald-500 text-white'
              )}
            >
              <Database size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-emerald-500 rounded-full transition-colors text-white"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-1 mb-4 landscape:mb-2">
          <button
            onClick={() => {
              setCurrentMonth(subMonths(currentMonth, 1));
              setFilterToday(false);
            }}
            className="p-2"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold capitalize landscape:text-sm">
              {format(currentMonth, 'MMMM / yy', { locale: ptBR })}
            </span>
            <button
              onClick={() => {
                setCurrentMonth(new Date());
                setFilterToday(false);
              }}
              className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              HOJE
            </button>
          </div>
          <button
            onClick={() => {
              setCurrentMonth(addMonths(currentMonth, 1));
              setFilterToday(false);
            }}
            className="p-2"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="text-center landscape:flex landscape:items-center landscape:justify-center landscape:gap-4">
          <p className="text-emerald-100 text-sm mb-1 landscape:mb-0">
            {selectedAccountIds.length === 0 || selectedAccountIds.length === accounts.length
              ? 'Saldo Total'
              : selectedAccountIds.length === 1
                ? 'Saldo da Conta'
                : 'Saldo das Contas'}
          </p>
          <h1 className="text-4xl landscape:text-2xl font-black tracking-tight">{formatCurrency(totalBalance)}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 landscape:p-2 pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              filteredTransactions={filteredTransactions}
              upcomingTransactions={upcomingTransactions}
              totals={totals}
              totalBalance={totalBalance}
              selectedAccountIds={selectedAccountIds}
              setSelectedAccountIds={setSelectedAccountIds}
              selectedCategoryIds={selectedCategoryIds}
              setSelectedCategoryIds={setSelectedCategoryIds}
              filterToday={filterToday}
              setFilterToday={setFilterToday}
              onToggleConsolidated={toggleConsolidated}
              onEditTransaction={(t) => {
                modalState.openTransactionModal('expense', t);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactionsByDay={transactionsByDay}
              categories={categories}
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              setSelectedAccountIds={setSelectedAccountIds}
              selectedCategoryIds={selectedCategoryIds}
              setSelectedCategoryIds={setSelectedCategoryIds}
              filterToday={filterToday}
              setFilterToday={setFilterToday}
              onToggleConsolidated={toggleConsolidated}
              onEditTransaction={(t) => {
                modalState.openTransactionModal('expense', t);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'accounts' && (
            <ManageView
              accounts={accounts}
              onEditAccount={(account) => {
                modalState.openAccountModal(account);
              }}
              onDeleteAccount={(account) => {
                modalState.openConfirm(
                  'Excluir Conta',
                  'Deseja excluir esta conta? Esta ação não pode ser desfeita.',
                  () => deleteDoc(doc(db, 'accounts', account.id))
                );
              }}
              onAddAccount={() => modalState.openAccountModal()}
              categories={categories}
              onEditCategory={(category) => {
                modalState.openCategoryModal(category);
              }}
              onDeleteCategory={(category) => {
                modalState.openConfirm(
                  'Excluir Categoria',
                  'Deseja excluir esta categoria? Esta ação não pode ser desfeita.',
                  () => deleteDoc(doc(db, 'categories', category.id))
                );
              }}
              onAddCategory={() => modalState.openCategoryModal()}
            />
          )}

          {activeTab === 'charts' && (
            <ChartsView
              filteredTransactions={filteredTransactions}
              categories={categories}
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              setSelectedAccountIds={setSelectedAccountIds}
              selectedCategoryIds={selectedCategoryIds}
              setSelectedCategoryIds={setSelectedCategoryIds}
              filterToday={filterToday}
              setFilterToday={setFilterToday}
              getPieData={getPieData}
            />
          )}

          {activeTab === 'data' && (
            <DataView
              isImporting={isImporting}
              importProgress={importProgress}
              importStatus={importStatus}
              importError={importError}
              onExport={exportToCSV}
              onImport={importFromCSV}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center fixed bottom-0 left-0 right-0 z-20 rounded-t-[2rem] shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <NavButton
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={<LayoutDashboard size={24} />}
          label="Início"
        />
        <NavButton
          active={activeTab === 'transactions'}
          onClick={() => setActiveTab('transactions')}
          icon={<ArrowUpCircle size={24} />}
          label="Extrato"
        />

        <button
          onClick={modalState.openQuickAction}
          className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 -mt-12 active:scale-90 transition-transform"
        >
          <Plus size={32} />
        </button>

        <NavButton
          active={activeTab === 'accounts'}
          onClick={() => setActiveTab('accounts')}
          icon={<Wallet size={24} />}
          label="Contas"
        />
        <NavButton
          active={activeTab === 'charts'}
          onClick={() => setActiveTab('charts')}
          icon={<PieChartIcon size={24} />}
          label="Análise"
        />
      </nav>

      {/* Transaction Modal */}
      <AnimatePresence>
        {modalState.isTransactionModalOpen && (
          <TransactionModal
            isOpen={modalState.isTransactionModalOpen}
            onClose={modalState.closeTransactionModal}
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            editingTransaction={modalState.editingTransaction}
            userId={user.uid}
            initialType={modalState.initialTransactionType}
            onDelete={(t) => {
              if (t.installmentId) {
                modalState.openInstallmentDelete(t, (mode) => {
                  deleteTransaction(t, mode);
                  modalState.closeTransactionModal();
                });
              } else {
                modalState.openConfirm(
                  'Excluir Lançamento',
                  'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
                  () => {
                    deleteTransaction(t);
                    modalState.closeTransactionModal();
                  }
                );
              }
            }}
          />
        )}
      </AnimatePresence>
      {/* Account Modal */}
      <AnimatePresence>
        {modalState.isAccountModalOpen && (
          <AccountModal
            isOpen={modalState.isAccountModalOpen}
            onClose={modalState.closeAccountModal}
            userId={user.uid}
            editingAccount={modalState.editingAccount}
            transactions={transactions}
          />
        )}
      </AnimatePresence>
      {/* Category Modal */}
      <AnimatePresence>
        {modalState.isCategoryModalOpen && (
          <CategoryModal
            isOpen={modalState.isCategoryModalOpen}
            onClose={modalState.closeCategoryModal}
            userId={user.uid}
            editingCategory={modalState.editingCategory}
          />
        )}
      </AnimatePresence>
      <UserSettingsModal
        isOpen={modalState.isSettingsOpen}
        onClose={modalState.closeSettings}
        user={user}
        includePreviousBalance={includePreviousBalance}
        setIncludePreviousBalance={setIncludePreviousBalance}
        transactionSortOrder={transactionSortOrder}
        setTransactionSortOrder={setTransactionSortOrder}
        onLogout={handleLogout}
      />
      <QuickActionPopup
        isOpen={modalState.isQuickActionOpen}
        onClose={modalState.closeQuickAction}
        onSelect={(type) => {
          modalState.closeQuickAction();
          modalState.openTransactionModal(type);
        }}
      />
      <ConfirmationModal
        isOpen={modalState.confirmModal.isOpen}
        title={modalState.confirmModal.title}
        message={modalState.confirmModal.message}
        onConfirm={modalState.confirmModal.onConfirm}
        onClose={modalState.closeConfirm}
      />
      <InstallmentDeleteModal
        isOpen={modalState.installmentDeleteModal.isOpen}
        transaction={modalState.installmentDeleteModal.transaction}
        onConfirm={modalState.installmentDeleteModal.onConfirm}
        onClose={modalState.closeInstallmentDelete}
      />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
