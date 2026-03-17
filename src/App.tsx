import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  writeBatch,
  orderBy,
  Timestamp,
  increment
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from './firebase';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  PieChart as PieChartIcon, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Circle,
  LogOut,
  Trash2,
  Edit2,
  X,
  CreditCard,
  Banknote,
  TrendingUp,
  Calendar,
  Download,
  Upload,
  Database,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addDays,
  addWeeks,
  addMonths, 
  addYears,
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  isToday,
  parseISO,
  subMonths,
  isAfter,
  isEqual,
  isSameDay,
  startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency, cn } from './utils';
import { Account, Transaction, Category, TransactionType } from './types';
import { handleFirestoreError } from './services/errorService';
import { DEFAULT_CATEGORIES } from './constants';
import { AccountModal } from './components/modals/AccountModal';
import { TransactionModal } from './components/modals/TransactionModal';
import { TransactionItem } from './components/TransactionItem';
import { NavButton } from './components/NavButton';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { QuickActionPopup } from './components/QuickActionPopup';
import { UserSettingsModal } from './components/modals/UserSettingsModal';
import { FilterSection } from './components/FilterSection';
import { Login } from './components/Login';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { AccountsView } from './components/views/AccountsView';
import { ChartsView } from './components/views/ChartsView';
import { DataView } from './components/views/DataView';

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'accounts' | 'charts' | 'data'>('dashboard');
  
  const exportToCSV = () => {
    const headers = ['Data Ocorrência', 'Descrição', 'Valor', 'Categoria', 'Conta'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || '';
      const acc = accounts.find(a => a.id === t.accountId)?.name || '';
      const date = format(parseISO(t.date), 'dd/MM/yyyy');
      const amount = t.type === 'expense' ? -t.amount : t.amount;
      return [date, t.description, amount.toFixed(2), cat, acc];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financas_pro_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const dataLines = lines.slice(1).filter(l => l.trim() !== '');
      
      const tempAccounts: Record<string, string> = {};
      const tempCategories: Record<string, string> = {};

      setIsImporting(true);
      setImportProgress(0);
      setImportStatus('processing');
      setImportError('');

      let skippedCount = 0;

      // Process in chunks of 100 rows to stay well within Firestore batch limits (500 ops)
      // and field transform limits (500 per doc).
      const CHUNK_SIZE = 100;
      const totalChunks = Math.ceil(dataLines.length / CHUNK_SIZE);
      
      for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
        const chunk = dataLines.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        const accountBalanceChanges: Record<string, number> = {};
        let hasOps = false;

        for (const line of chunk) {
          // Robust CSV line parsing (handles commas inside quotes)
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (values.length < 5) {
            skippedCount++;
            continue;
          }
          const [dateStr, description, amountStr, catName, accName] = values.map(v => v.replace(/^"|"$/g, '').trim());
          
          // Robust date parsing (handles / and - separators)
          let dateObj: Date | null = null;
          const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 4) { // YYYY-MM-DD
              dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
            } else { // DD/MM/YYYY
              dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
            }
          }

          if (!dateObj || isNaN(dateObj.getTime())) {
            skippedCount++;
            continue;
          }
          const date = dateObj.toISOString();
          
          // Handle both dot and comma as decimal separator
          const amount = parseFloat(amountStr.replace(',', '.'));
          if (isNaN(amount)) {
            skippedCount++;
            continue;
          }
          const type = amount >= 0 ? 'income' : 'expense';
          const absAmount = Math.abs(amount);

          let accountId = accounts.find(a => a.name.toLowerCase() === accName.toLowerCase())?.id || tempAccounts[accName.toLowerCase()];
          if (!accountId) {
            const accRef = doc(collection(db, 'accounts'));
            accountId = accRef.id;
            tempAccounts[accName.toLowerCase()] = accountId;
            batch.set(accRef, {
              name: accName,
              type: 'checking',
              balance: 0,
              initialBalance: 0,
              initialBalanceDate: format(new Date(), 'yyyy-MM-dd'),
              color: '#94a3b8',
              userId: user!.uid
            });
          }

          let categoryId = categories.find(c => c.name.toLowerCase() === catName.toLowerCase() && (c.type === type || c.type === 'both'))?.id || tempCategories[catName.toLowerCase() + type];
          if (!categoryId) {
            const catRef = doc(collection(db, 'categories'));
            categoryId = catRef.id;
            tempCategories[catName.toLowerCase() + type] = categoryId;
            batch.set(catRef, {
              name: catName,
              icon: 'Plus',
              color: '#94a3b8',
              type: type,
              userId: user!.uid
            });
          }

          const tRef = doc(collection(db, 'transactions'));
          batch.set(tRef, {
            description,
            amount: absAmount,
            date,
            accountId,
            categoryId,
            type,
            isConsolidated: true,
            userId: user!.uid
          });

          accountBalanceChanges[accountId] = (accountBalanceChanges[accountId] || 0) + amount;
          hasOps = true;
        }

        if (hasOps) {
          // Apply aggregated balance changes for this chunk
          for (const accId in accountBalanceChanges) {
            const accRef = doc(db, 'accounts', accId);
            batch.update(accRef, { balance: increment(accountBalanceChanges[accId]) });
          }

          try {
            await batch.commit();
            const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
            setImportProgress(Math.round((currentChunk / totalChunks) * 100));
          } catch (err: any) {
            setImportStatus('error');
            setImportError(err.message || 'Erro ao processar lote.');
            setIsImporting(false);
            handleFirestoreError(err, 'write', 'import');
            return;
          }
        }
      }
      
      if (skippedCount > 0) {
        setImportStatus('error');
        setImportError(`Importação concluída com ${skippedCount} linhas ignoradas devido a formato inválido.`);
      } else {
        setImportStatus('success');
      }
      
      setImportProgress(100);
      setIsImporting(false);
      setTimeout(() => {
        setImportStatus('idle');
        setImportProgress(0);
      }, 5000);
    };
    reader.readAsText(file);
  };
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [filterToday, setFilterToday] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>('expense');
  const extratoRef = React.useRef<HTMLDivElement>(null);
  const [hasScrolledToToday, setHasScrolledToToday] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };
  const [includePreviousBalance, setIncludePreviousBalance] = useState(() => {
    const saved = localStorage.getItem('includePreviousBalance');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [transactionSortOrder, setTransactionSortOrder] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('transactionSortOrder');
    return (saved as 'asc' | 'desc') || 'desc';
  });

  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- Data Fetching ---

  useEffect(() => {
    if (!user) return;

    // Seed default categories
    const seedCategories = async () => {
      const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach(cat => {
          const ref = doc(collection(db, 'categories'));
          batch.set(ref, { ...cat, userId: user.uid });
        });
        await batch.commit();
      }
    };
    seedCategories();

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      setAccounts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    }, (err) => handleFirestoreError(err, 'list', 'accounts'));

    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    }, (err) => handleFirestoreError(err, 'list', 'transactions'));

    const qCategories = query(collection(db, 'categories'), where('userId', 'in', [null, user.uid]));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (err) => handleFirestoreError(err, 'list', 'categories'));

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
    };
  }, [user]);

  // --- Derived State ---

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      const dateMatch = filterToday ? isToday(tDate) : isSameMonth(tDate, currentMonth);
      const accountMatch = selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
      const categoryMatch = selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
      return dateMatch && accountMatch && categoryMatch;
    })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, currentMonth, selectedAccountId, selectedCategoryId, filterToday]);

  const totals = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const totalBalance = useMemo(() => {
    if (selectedAccountId !== 'all') {
      return accounts.find(a => a.id === selectedAccountId)?.balance || 0;
    }
    return accounts.reduce((acc, a) => acc + a.balance, 0);
  }, [accounts, selectedAccountId]);

  const upcomingTransactions = useMemo(() => {
    const today = startOfDay(new Date());
    return transactions
      .filter(t => {
        const tDate = parseISO(t.date);
        return isAfter(tDate, today) || isSameDay(tDate, today);
      })
      .filter(t => {
        const accountMatch = selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
        const categoryMatch = selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
        return accountMatch && categoryMatch;
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [transactions, selectedAccountId, selectedCategoryId]);

  const transactionsByDay = useMemo(() => {
    // 1. Calculate the "Initial System Balance" (Balance before any transactions in the system)
    // We start from the current balance and subtract all consolidated transactions.
    const consolidatedSum = transactions.reduce((acc, t) => {
      if (!t.isConsolidated) return acc;
      
      // Filter out transactions before the account's initial balance date
      const account = accounts.find(a => a.id === t.accountId);
      const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
      
      if (account && t.date < account.initialBalanceDate) return acc;
      if (t.type === 'transfer' && toAccount && t.date < toAccount.initialBalanceDate) return acc;

      if (selectedAccountId !== 'all') {
        if (t.type === 'transfer') {
          if (t.accountId === selectedAccountId) return acc - t.amount;
          if (t.toAccountId === selectedAccountId) return acc + t.amount;
          return acc;
        }
        if (t.accountId !== selectedAccountId) return acc;
      } else if (t.type === 'transfer') return acc;

      if (t.type === 'income') return acc + t.amount;
      if (t.type === 'expense') return acc - t.amount;
      return acc;
    }, 0);

    const initialSystemBalance = totalBalance - consolidatedSum;
    
    let runningBalance = initialSystemBalance;

    // 2. Add transactions BEFORE the current view to runningBalance
    const startOfView = filterToday ? startOfDay(new Date()) : startOfMonth(currentMonth);
    
    // Sort all transactions ascending for running balance calculation
    const allSorted = [...transactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    allSorted
      .filter(t => {
        const tDate = parseISO(t.date);
        const accountMatch = selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
        
        // Filter out transactions before the account's initial balance date
        const account = accounts.find(a => a.id === t.accountId);
        const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
        if (account && t.date < account.initialBalanceDate) return false;
        if (t.type === 'transfer' && toAccount && t.date < toAccount.initialBalanceDate) return false;

        return tDate < startOfView && accountMatch;
      })
      .forEach(t => {
        if (t.type === 'income') runningBalance += t.amount;
        else if (t.type === 'expense') runningBalance -= t.amount;
        else if (t.type === 'transfer') {
          if (selectedAccountId !== 'all') {
            if (t.accountId === selectedAccountId) runningBalance -= t.amount;
            else if (t.toAccountId === selectedAccountId) runningBalance += t.amount;
          }
        }
      });

    if (!includePreviousBalance) runningBalance = 0;

    // 3. Process transactions IN the view
    const inViewTransactions = allSorted
      .filter(t => {
        const tDate = parseISO(t.date);
        const accountMatch = selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
        
        // Filter out transactions before the account's initial balance date
        const account = accounts.find(a => a.id === t.accountId);
        const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
        if (account && t.date < account.initialBalanceDate) return false;
        if (t.type === 'transfer' && toAccount && t.date < toAccount.initialBalanceDate) return false;

        const isInView = filterToday ? isToday(tDate) : isSameMonth(tDate, currentMonth);
        return isInView && accountMatch;
      });

    const groups: { date: string, transactions: Transaction[], dayTotal: number, runningBalance: number }[] = [];
    
    inViewTransactions.forEach(t => {
      let amount = 0;
      if (t.type === 'income') amount = t.amount;
      else if (t.type === 'expense') amount = -t.amount;
      else if (t.type === 'transfer') {
        if (selectedAccountId !== 'all') {
          if (t.accountId === selectedAccountId) amount = -t.amount;
          else if (t.toAccountId === selectedAccountId) amount = t.amount;
        }
      }
      
      runningBalance += amount;

      const categoryMatch = selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
      if (categoryMatch) {
        const dateStr = t.date;
        let group = groups.find(g => g.date === dateStr);
        if (!group) {
          group = { date: dateStr, transactions: [], dayTotal: 0, runningBalance: 0 };
          groups.push(group);
        }
        group.transactions.push(t);
        group.dayTotal += amount;
        group.runningBalance = runningBalance;
      }
    });

    // Final sort based on user preference
    return groups.sort((a, b) => {
      const timeA = parseISO(a.date).getTime();
      const timeB = parseISO(b.date).getTime();
      return transactionSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, accounts, includePreviousBalance, currentMonth, filterToday, selectedAccountId, selectedCategoryId, totalBalance, transactionSortOrder]);

  useEffect(() => {
    if (activeTab === 'transactions' && !hasScrolledToToday && transactionsByDay.length > 0) {
      const todayGroup = transactionsByDay.find(g => isToday(parseISO(g.date)));
      if (todayGroup) {
        const element = document.getElementById(`group-${todayGroup.date}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHasScrolledToToday(true);
        }
      }
    }
  }, [activeTab, transactionsByDay, hasScrolledToToday]);

  const getPieData = (transactions: Transaction[], categories: Category[]) => {
    const data: { [key: string]: { name: string, value: number, color: string } } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Outros';
      if (!data[name]) {
        data[name] = { name, value: 0, color: cat?.color || '#cbd5e1' };
      }
      data[name].value += t.amount;
    });
    return Object.values(data).sort((a, b) => b.value - a.value);
  };

  // --- Handlers ---

  const toggleConsolidated = async (transaction: Transaction) => {
    try {
      const batch = writeBatch(db);
      const docRef = doc(db, 'transactions', transaction.id);
      const newStatus = !transaction.isConsolidated;
      batch.update(docRef, { isConsolidated: newStatus });
      
      // Update account balance
      const diff = transaction.amount * (newStatus ? 1 : -1);
      
      if (transaction.type === 'transfer') {
        const fromRef = doc(db, 'accounts', transaction.accountId);
        const toRef = doc(db, 'accounts', transaction.toAccountId!);
        batch.update(fromRef, { balance: increment(-diff) });
        batch.update(toRef, { balance: increment(diff) });
      } else {
        const accountRef = doc(db, 'accounts', transaction.accountId);
        const accountDiff = transaction.type === 'income' ? diff : -diff;
        batch.update(accountRef, { balance: increment(accountDiff) });
      }
      
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, 'update', `transactions/${transaction.id}`);
    }
  };

  const deleteTransaction = async (transaction: Transaction, mode: 'only' | 'future' = 'only') => {
    try {
      const batch = writeBatch(db);
      
      const reverseBalance = (t: Transaction) => {
        if (!t.isConsolidated) return;
        if (t.type === 'transfer') {
          batch.update(doc(db, 'accounts', t.accountId), { balance: increment(t.amount) });
          batch.update(doc(db, 'accounts', t.toAccountId!), { balance: increment(-t.amount) });
        } else {
          const diff = t.type === 'income' ? -t.amount : t.amount;
          batch.update(doc(db, 'accounts', t.accountId), { balance: increment(diff) });
        }
      };

      if (mode === 'only' || !transaction.installmentId) {
        batch.delete(doc(db, 'transactions', transaction.id));
        reverseBalance(transaction);
      } else {
        const future = transactions.filter(t => 
          t.installmentId === transaction.installmentId && 
          (t.installmentNumber || 0) >= (transaction.installmentNumber || 0)
        );
        future.forEach(t => {
          batch.delete(doc(db, 'transactions', t.id));
          reverseBalance(t);
        });
      }
      
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, 'delete', 'transactions');
    }
  }  // --- Components ---

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 pt-8 pb-6 landscape:pt-4 landscape:pb-4 rounded-b-[2.5rem] landscape:rounded-b-[1.5rem] shadow-lg transition-all">
        <div className="flex justify-between items-center mb-6 landscape:mb-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
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
                "p-2 rounded-full transition-colors",
                activeTab === 'data' ? "bg-white text-emerald-600" : "hover:bg-emerald-500 text-white"
              )}
            >
              <Database size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-emerald-500 rounded-full transition-colors text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-1 mb-4 landscape:mb-2">
          <button onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setFilterToday(false); }} className="p-2">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold capitalize landscape:text-sm">{format(currentMonth, 'MMMM / yy', { locale: ptBR })}</span>
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
          <button onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setFilterToday(false); }} className="p-2">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="text-center landscape:flex landscape:items-center landscape:justify-center landscape:gap-4">
          <p className="text-emerald-100 text-sm mb-1 landscape:mb-0">
            {selectedAccountId === 'all' ? 'Saldo Total' : 'Saldo da Conta'}
          </p>
          <h1 className="text-4xl landscape:text-2xl font-black tracking-tight">{formatCurrency(totalBalance)}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 landscape:p-2 pb-24">
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
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              filterToday={filterToday}
              setFilterToday={setFilterToday}
              onToggleConsolidated={toggleConsolidated}
              onEditTransaction={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              onDeleteTransaction={(t) => {
                openConfirm(
                  'Excluir Lançamento',
                  'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
                  () => deleteTransaction(t)
                );
              }}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView 
              transactionsByDay={transactionsByDay}
              categories={categories}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              filterToday={filterToday}
              setFilterToday={setFilterToday}
              onToggleConsolidated={toggleConsolidated}
              onEditTransaction={(t) => { setEditingTransaction(t); setIsModalOpen(true); }}
              onDeleteTransaction={(t) => {
                openConfirm(
                  'Excluir Lançamento',
                  'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
                  () => deleteTransaction(t)
                );
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView 
              accounts={accounts}
              onEditAccount={(account) => {
                setEditingAccount(account);
                setIsAccountModalOpen(true);
              }}
              onDeleteAccount={(account) => {
                openConfirm(
                  'Excluir Conta',
                  'Deseja excluir esta conta? Esta ação não pode ser desfeita.',
                  () => deleteDoc(doc(db, 'accounts', account.id))
                );
              }}
              onAddAccount={() => setIsAccountModalOpen(true)}
            />
          )}

          {activeTab === 'charts' && (
            <ChartsView 
              filteredTransactions={filteredTransactions}
              categories={categories}
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
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
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Início" />
        <NavButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<ArrowUpCircle size={24} />} label="Extrato" />
        
        <button 
          onClick={() => setIsQuickActionOpen(true)}
          className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 -mt-12 active:scale-90 transition-transform"
        >
          <Plus size={32} />
        </button>

        <NavButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<Wallet size={24} />} label="Contas" />
        <NavButton active={activeTab === 'charts'} onClick={() => setActiveTab('charts')} icon={<PieChartIcon size={24} />} label="Análise" />
      </nav>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            accounts={accounts}
            categories={categories}
            transactions={transactions}
            editingTransaction={editingTransaction}
            userId={user.uid}
            initialType={initialTransactionType}
            onDelete={(t) => {
              openConfirm(
                'Excluir Lançamento',
                'Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.',
                () => {
                  deleteTransaction(t);
                  setIsModalOpen(false);
                }
              );
            }}
          />
        )}
      </AnimatePresence>
      {/* Account Modal */}
      <AnimatePresence>
        {isAccountModalOpen && (
          <AccountModal 
            isOpen={isAccountModalOpen}
            onClose={() => {
              setIsAccountModalOpen(false);
              setEditingAccount(null);
            }}
            userId={user.uid}
            editingAccount={editingAccount}
            transactions={transactions}
          />
        )}
      </AnimatePresence>
      <UserSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        includePreviousBalance={includePreviousBalance}
        setIncludePreviousBalance={setIncludePreviousBalance}
        transactionSortOrder={transactionSortOrder}
        setTransactionSortOrder={setTransactionSortOrder}
        onLogout={handleLogout}
      />
      <QuickActionPopup 
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelect={(type) => {
          setInitialTransactionType(type);
          setEditingTransaction(null);
          setIsQuickActionOpen(false);
          setIsModalOpen(true);
        }}
      />
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}


