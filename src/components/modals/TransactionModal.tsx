import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Tag,
  Utensils,
  Car,
  Home,
  GraduationCap,
  Gamepad2,
  HeartPulse,
  Briefcase,
  TrendingUp,
  ShoppingBag,
  Shirt,
  Plane,
  Coffee,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { doc, collection, writeBatch, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Account, Transaction, Category, TransactionType } from '../../types';
import { handleFirestoreError } from '../../services/errorService';
import { DatabaseService } from '../../services/databaseService';
import { ConnectionService } from '../../services/connectionService';
import { LocalStorageService } from '../../services/localStorageService';
import { cn } from '../../utils';

const LAST_USED_ACCOUNT_KEY = 'lastUsedAccountId';

const CATEGORY_ICONS = [
  { id: 'Tag', icon: Tag },
  { id: 'Utensils', icon: Utensils },
  { id: 'Car', icon: Car },
  { id: 'Home', icon: Home },
  { id: 'GraduationCap', icon: GraduationCap },
  { id: 'Gamepad2', icon: Gamepad2 },
  { id: 'HeartPulse', icon: HeartPulse },
  { id: 'Briefcase', icon: Briefcase },
  { id: 'TrendingUp', icon: TrendingUp },
  { id: 'ShoppingBag', icon: ShoppingBag },
  { id: 'Shirt', icon: Shirt },
  { id: 'Plane', icon: Plane },
  { id: 'Coffee', icon: Coffee },
  { id: 'Smartphone', icon: Smartphone },
  { id: 'DollarSign', icon: DollarSign },
];

const CATEGORY_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#a855f7',
  '#94a3b8',
  '#64748b',
  '#475569',
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  editingTransaction: Transaction | null;
  userId: string;
  initialType?: TransactionType;
  onDelete: (t: Transaction) => void;
}

export function TransactionModal({
  onClose,
  accounts,
  categories,
  transactions,
  editingTransaction,
  userId,
  initialType,
  onDelete,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || initialType || 'expense');
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [amount, setAmount] = useState(editingTransaction ? (editingTransaction.amount * 100).toFixed(0) : '0');
  const [date, setDate] = useState(editingTransaction?.date.split('T')[0] || format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState(editingTransaction?.accountId || '');
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId || '');
  const [toAccountId, setToAccountId] = useState(editingTransaction?.toAccountId || '');
  const [frequency, setFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
  >(
    (editingTransaction?.frequency as
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'bimonthly'
      | 'quarterly'
      | 'semiannual'
      | 'annual') || 'monthly'
  );
  const [installments, setInstallments] = useState(editingTransaction?.totalInstallments?.toString() || '1');
  const [isInfinite, setIsInfinite] = useState(editingTransaction?.totalInstallments === null);
  const [isConsolidated, setIsConsolidated] = useState(editingTransaction?.isConsolidated || false);
  const [editMode, setEditMode] = useState<'only' | 'future'>('only');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Transaction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSelectedSuggestion, setLastSelectedSuggestion] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // State for inline category creation
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#94a3b8');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (description.length >= 2 && description !== lastSelectedSuggestion) {
      const filtered = transactions
        .filter((t) => t.description.toLowerCase().includes(description.toLowerCase()))
        .reduce((acc: Transaction[], current) => {
          const key = `${current.description.toLowerCase()}-${current.categoryId}-${current.accountId}`;
          const x = acc.find(
            (item) => `${item.description.toLowerCase()}-${item.categoryId}-${item.accountId}` === key
          );
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, [])
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [description, transactions, lastSelectedSuggestion]);

  const selectSuggestion = (suggestion: Transaction) => {
    setLastSelectedSuggestion(suggestion.description);
    setDescription(suggestion.description);
    setAccountId(suggestion.accountId);
    if (suggestion.type !== 'transfer') {
      setCategoryId(suggestion.categoryId);
      setType(suggestion.type);
    } else {
      setToAccountId(suggestion.toAccountId || '');
      setType('transfer');
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (amountInputRef.current) {
      const len = amountInputRef.current.value.length;
      amountInputRef.current.setSelectionRange(len, len);
    }
  }, [amount]);

  useEffect(() => {
    if (!editingTransaction && accounts.length > 0 && !accountId) {
      const loadLastUsedAccount = async () => {
        try {
          const lastUsedAccountId = await LocalStorageService.getMetadata(LAST_USED_ACCOUNT_KEY);
          if (typeof lastUsedAccountId === 'string' && accounts.some((acc) => acc.id === lastUsedAccountId)) {
            setAccountId(lastUsedAccountId);
          } else {
            setAccountId(accounts[0]?.id || '');
          }
        } catch {
          setAccountId(accounts[0]?.id || '');
        }
      };
      loadLastUsedAccount();
    }
  }, [editingTransaction, accounts, accountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value || '0');
  };

  const displayAmount = (parseFloat(amount) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const categoryData = {
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: type === 'transfer' ? 'both' : type,
        userId,
      };

      const docId = await DatabaseService.addDocument('categories', categoryData);

      // Set the newly created category as selected
      setCategoryId(docId);
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setNewCategoryColor('#94a3b8');
      setNewCategoryIcon('Tag');
    } catch (err) {
      handleFirestoreError(err, 'create', 'categories');
    }
  };

  const handleSave = async () => {
    const numericAmount = parseFloat(amount) / 100;
    if (!description || !accountId || (type === 'transfer' && !toAccountId)) return;
    if (type === 'transfer' && numericAmount <= 0) return;
    if (type !== 'transfer' && numericAmount <= 0) return;
    if (isSaving) return;
    if (!db) return; // Guard against null db

    setIsSaving(true);
    try {
      const baseTransaction = {
        description,
        amount: numericAmount,
        date: new Date(date + 'T12:00:00').toISOString(),
        accountId,
        categoryId: type === 'transfer' ? 'transfer' : categoryId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        type,
        isConsolidated,
        userId,
        frequency: type === 'transfer' || installments !== '1' ? frequency : null,
      };

      const batch = writeBatch(db);

      const getNextDate = (currentDate: Date, freq: string, index: number) => {
        switch (freq) {
          case 'daily':
            return addDays(currentDate, index);
          case 'weekly':
            return addWeeks(currentDate, index);
          case 'monthly':
            return addMonths(currentDate, index);
          case 'bimonthly':
            return addMonths(currentDate, index * 2);
          case 'quarterly':
            return addMonths(currentDate, index * 3);
          case 'semiannual':
            return addMonths(currentDate, index * 6);
          case 'annual':
            return addYears(currentDate, index);
          default:
            return addMonths(currentDate, index);
        }
      };

      const updateBalance = (
        t: Omit<Transaction, 'id'> | Transaction | typeof baseTransaction,
        isNew: boolean,
        oldT?: Transaction
      ) => {
        if (!t.isConsolidated && (!oldT || !oldT.isConsolidated)) return;

        if (isNew) {
          const diff = t.type === 'income' ? t.amount : -t.amount;
          batch.update(doc(db!, 'accounts', t.accountId), { balance: increment(diff) });
        } else if (oldT) {
          if (oldT.isConsolidated) {
            const diff = oldT.type === 'income' ? -oldT.amount : oldT.amount;
            batch.update(doc(db!, 'accounts', oldT.accountId), { balance: increment(diff) });
          }
          if (t.isConsolidated) {
            const diff = t.type === 'income' ? t.amount : -t.amount;
            batch.update(doc(db!, 'accounts', t.accountId), { balance: increment(diff) });
          }
        }
      };

      const createTransferPair = (
        desc: string,
        amt: number,
        dt: string,
        fromAcct: string,
        toAcct: string,
        consolidated: boolean,
        instId?: string,
        instNum?: number,
        totalInst?: number | null,
        freq?: string | null
      ) => {
        const transferId = crypto.randomUUID();

        const expenseRef = doc(collection(db!, 'transactions'));
        const expenseTransaction = {
          description: desc,
          amount: amt,
          date: dt,
          accountId: fromAcct,
          categoryId: 'transfer',
          type: 'expense' as TransactionType,
          isConsolidated: consolidated,
          userId,
          transferId,
          installmentId: instId,
          installmentNumber: instNum,
          totalInstallments: totalInst,
          frequency: freq,
        };
        batch.set(expenseRef, expenseTransaction);
        updateBalance(expenseTransaction, true);

        const incomeRef = doc(collection(db!, 'transactions'));
        const incomeTransaction = {
          description: desc,
          amount: amt,
          date: dt,
          accountId: toAcct,
          categoryId: 'transfer',
          type: 'income' as TransactionType,
          isConsolidated: consolidated,
          userId,
          transferId,
          installmentId: instId,
          installmentNumber: instNum,
          totalInstallments: totalInst,
          frequency: freq,
        };
        batch.set(incomeRef, incomeTransaction);
        updateBalance(incomeTransaction, true);
      };

      if (editingTransaction) {
        if (editingTransaction.transferId) {
          // Handle transfer edits - update both paired transactions
          const pairedTransactions = transactions.filter((t) => t.transferId === editingTransaction.transferId);

          if (editMode === 'future' && editingTransaction.installmentId) {
            // For future edits of installment transfers
            const q = query(
              collection(db!, 'transactions'),
              where('transferId', '==', editingTransaction.transferId),
              where('userId', '==', userId)
            );
            const snap = await getDocs(q);
            const allPairedDocs = snap.docs.filter(
              (d) => (d.data().installmentNumber || 0) >= (editingTransaction.installmentNumber || 0)
            );

            allPairedDocs.forEach((d) => {
              const dData = d.data() as Transaction;
              const indexDiff = (dData.installmentNumber || 1) - (editingTransaction.installmentNumber || 1);
              const newDate = getNextDate(new Date(date), frequency, indexDiff);

              const descriptionWithSuffix =
                dData.totalInstallments === null
                  ? `${description} (#${dData.installmentNumber})`
                  : dData.totalInstallments
                    ? `${description} (${dData.installmentNumber}/${dData.totalInstallments})`
                    : description;

              const updatedT = {
                description: descriptionWithSuffix,
                amount: numericAmount,
                date: newDate.toISOString(),
                accountId: dData.type === 'expense' ? accountId : toAccountId,
                categoryId: 'transfer',
                type: dData.type,
                isConsolidated: dData.isConsolidated,
                userId,
                transferId: dData.transferId,
                installmentId: dData.installmentId,
                installmentNumber: dData.installmentNumber,
                totalInstallments: dData.totalInstallments,
                frequency,
              };
              batch.update(d.ref, updatedT);
              updateBalance(updatedT, false, dData);
            });
          } else {
            // For single transfer edits, update both transactions
            pairedTransactions.forEach((t) => {
              const updatedT = {
                description,
                amount: numericAmount,
                date: new Date(date + 'T12:00:00').toISOString(),
                accountId: t.type === 'expense' ? accountId : toAccountId,
                categoryId: 'transfer',
                type: t.type,
                isConsolidated: t.isConsolidated,
                userId,
                transferId: t.transferId,
                toAccountId: t.type === 'expense' ? toAccountId : accountId,
                frequency: t.frequency,
                installmentId: t.installmentId,
                installmentNumber: t.installmentNumber,
                totalInstallments: t.totalInstallments,
              };
              batch.update(doc(db!, 'transactions', t.id), updatedT);
              updateBalance(updatedT, false, t);
            });
          }
        } else if (editMode === 'future' && editingTransaction.installmentId) {
          const q = query(
            collection(db, 'transactions'),
            where('installmentId', '==', editingTransaction.installmentId),
            where('userId', '==', userId)
          );
          const snap = await getDocs(q);
          const futureDocs = snap.docs.filter(
            (d) => (d.data().installmentNumber || 0) >= (editingTransaction.installmentNumber || 0)
          );

          futureDocs.forEach((d) => {
            const dData = d.data() as Transaction;
            const indexDiff = (dData.installmentNumber || 1) - (editingTransaction.installmentNumber || 1);
            const newDate = getNextDate(new Date(date), frequency, indexDiff);

            const descriptionWithSuffix =
              dData.totalInstallments === null
                ? `${description} (#${dData.installmentNumber})`
                : dData.totalInstallments
                  ? `${description} (${dData.installmentNumber}/${dData.totalInstallments})`
                  : description;

            const updatedT = {
              ...baseTransaction,
              description: descriptionWithSuffix,
              date: newDate.toISOString(),
              installmentNumber: dData.installmentNumber,
              totalInstallments: dData.totalInstallments,
              installmentId: dData.installmentId,
            };
            batch.update(d.ref, updatedT);
            updateBalance(updatedT, false, dData);
          });
        } else {
          batch.update(doc(db, 'transactions', editingTransaction.id), baseTransaction);
          updateBalance(baseTransaction, false, editingTransaction);
        }
      } else {
        const numInstallments = isInfinite ? 24 : parseInt(installments);

        if (type === 'transfer') {
          if (numInstallments > 1 || isInfinite) {
            const installmentId = crypto.randomUUID();
            for (let i = 0; i < numInstallments; i++) {
              const installmentDate = getNextDate(new Date(date), frequency, i);
              const descriptionWithSuffix = isInfinite
                ? `${description} (#${i + 1})`
                : `${description} (${i + 1}/${numInstallments})`;

              createTransferPair(
                descriptionWithSuffix,
                numericAmount,
                installmentDate.toISOString(),
                accountId,
                toAccountId,
                i === 0 ? isConsolidated : false,
                installmentId,
                i + 1,
                isInfinite ? null : numInstallments,
                frequency
              );
            }
          } else {
            createTransferPair(
              description,
              numericAmount,
              new Date(date + 'T12:00:00').toISOString(),
              accountId,
              toAccountId,
              isConsolidated,
              undefined,
              undefined,
              undefined,
              null
            );
          }
        } else if (numInstallments > 1 || isInfinite) {
          const installmentId = crypto.randomUUID();
          for (let i = 0; i < numInstallments; i++) {
            const installmentDate = getNextDate(new Date(date), frequency, i);
            const tRef = doc(collection(db, 'transactions'));
            const descriptionWithSuffix = isInfinite
              ? `${description} (#${i + 1})`
              : `${description} (${i + 1}/${numInstallments})`;
            const newT = {
              ...baseTransaction,
              description: descriptionWithSuffix,
              date: installmentDate.toISOString(),
              installmentId,
              installmentNumber: i + 1,
              totalInstallments: isInfinite ? null : numInstallments,
              isConsolidated: i === 0 ? isConsolidated : false,
            };
            batch.set(tRef, newT);
            updateBalance(newT, true);
          }
        } else {
          const tRef = doc(collection(db, 'transactions'));
          batch.set(tRef, baseTransaction);
          updateBalance(baseTransaction, true);
        }
      }

      await batch.commit();

      // Save the last used account for new transactions
      if (!editingTransaction && accountId) {
        try {
          await LocalStorageService.setMetadata(LAST_USED_ACCOUNT_KEY, accountId);
        } catch {
          console.error('Failed to save last used account');
        }
      }

      // If offline, ensure the operation is also queued in our custom offline system
      // as a backup to Firebase's built-in offline persistence
      if (!ConnectionService.isOnline()) {
        console.log('Transaction saved offline - will sync when connection is restored');
      }
    } catch (err) {
      // If the error is due to being offline, close the modal anyway
      // Firebase's offline persistence will queue the operations
      if (!ConnectionService.isOnline()) {
        console.log('Transaction queued offline via Firebase persistence');
        return; // Exit without showing error
      }
      handleFirestoreError(err, editingTransaction ? 'update' : 'create', 'transactions');
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const typeLabel = type === 'income' ? 'Receita' : type === 'expense' ? 'Despesa' : 'Transferência';

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
        className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex-1 text-center">
            {editingTransaction ? 'Editar' : 'Novo'} {typeLabel}
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : t === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400'
              )}
            >
              {t === 'expense' ? 'Despesa' : t === 'income' ? 'Receita' : 'Transf.'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="transaction-amount"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1"
            >
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
              <input
                id="transaction-amount"
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                value={displayAmount}
                onChange={handleAmountChange}
                onClick={() => {
                  if (amountInputRef.current) {
                    const len = amountInputRef.current.value.length;
                    amountInputRef.current.setSelectionRange(len, len);
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    if (amountInputRef.current) {
                      const len = amountInputRef.current.value.length;
                      amountInputRef.current.setSelectionRange(len, len);
                    }
                  }, 0);
                }}
                className={cn(
                  'w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-3xl font-black focus:ring-2 transition-all text-right',
                  type === 'income'
                    ? 'text-emerald-600 focus:ring-emerald-500'
                    : type === 'expense'
                      ? 'text-rose-600 focus:ring-rose-500'
                      : 'text-violet-600 focus:ring-violet-500'
                )}
              />
            </div>
          </div>

          <div className="relative" ref={suggestionRef}>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (lastSelectedSuggestion) setLastSelectedSuggestion(null);
              }}
              onFocus={() =>
                description.length >= 2 && description !== lastSelectedSuggestion && setShowSuggestions(true)
              }
              className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Supermercado"
            />
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                >
                  <div className="p-2 bg-slate-50 border-b border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Sugestões anteriores
                    </p>
                  </div>
                  {suggestions.map((s, idx) => {
                    const cat = categories.find((c) => c.id === s.categoryId);
                    const acc = accounts.find((a) => a.id === s.accountId);
                    return (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(s)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-slate-50 last:border-none transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{s.description}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">{acc?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] text-slate-500 font-medium">
                              {s.type === 'transfer' ? 'Transferência' : cat?.name || 'Sem categoria'}
                            </span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Plus size={14} />
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={cn('grid gap-4', type === 'transfer' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {type === 'transfer' ? 'De Conta' : 'Conta'}
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  {[...accounts]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                {accounts.find((a) => a.id === accountId) && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: accounts.find((a) => a.id === accountId)?.color }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {type === 'transfer' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Para Conta</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="">Selecionar conta destino...</option>
                {[...accounts]
                  .filter((a) => a.id !== accountId)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {type !== 'transfer' && (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Categoria
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 appearance-none"
                    disabled={isCreatingCategory}
                  >
                    <option value="">Selecionar...</option>
                    {[...categories]
                      .filter((c) => c.type === type || c.type === 'both')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className={cn(
                    'px-4 py-4 rounded-2xl font-bold text-sm transition-all',
                    isCreatingCategory
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  )}
                  type="button"
                >
                  <Plus size={20} className={cn('transition-transform', isCreatingCategory && 'rotate-45')} />
                </button>
              </div>

              <AnimatePresence>
                {isCreatingCategory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                      <input
                        type="text"
                        placeholder="Nome da categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-none rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 text-sm"
                      />

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                          Ícone
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {CATEGORY_ICONS.map(({ id, icon: Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setNewCategoryIcon(id)}
                              className={cn(
                                'aspect-square rounded-xl flex items-center justify-center transition-all',
                                newCategoryIcon === id
                                  ? 'bg-emerald-600 text-white shadow-lg scale-110'
                                  : 'bg-white text-slate-600 hover:bg-slate-100'
                              )}
                            >
                              <Icon size={16} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                          Cor
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                          {CATEGORY_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewCategoryColor(c)}
                              className={cn(
                                'aspect-square rounded-xl transition-all',
                                newCategoryColor === c ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-105'
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Criar Categoria
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!editingTransaction && (
            <div className="space-y-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"
              >
                <Plus size={14} className={cn('transition-transform', showAdvanced && 'rotate-45')} />
                {type === 'transfer' ? 'Opções de Recorrência' : 'Opções de Parcelamento'}
              </button>

              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="transaction-installments"
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1"
                      >
                        {type === 'transfer' ? 'Repetições' : 'Parcelas'}
                      </label>
                      <input
                        id="transaction-installments"
                        type="number"
                        min="1"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        disabled={isInfinite}
                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="transaction-frequency"
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1"
                      >
                        Frequência
                      </label>
                      <select
                        id="transaction-frequency"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as typeof frequency)}
                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 appearance-none"
                      >
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensal</option>
                        <option value="bimonthly">Bimestral</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="semiannual">Semestral</option>
                        <option value="annual">Anual</option>
                      </select>
                    </div>
                  </div>

                  {!isInfinite && parseInt(installments) > 1 && (
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                          Valor Total
                        </span>
                        <span className="text-2xl font-black text-emerald-600">
                          R${' '}
                          {((parseFloat(amount) / 100) * parseInt(installments)).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-2">
                        {installments} × R${' '}
                        {(parseFloat(amount) / 100).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInfinite}
                      onChange={(e) => setIsInfinite(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {type === 'transfer' ? 'Repetição Indefinida' : 'Parcelamento Indefinido'}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {type === 'transfer'
                          ? 'Repetir automaticamente sem data final (ex: internet, aluguel)'
                          : 'Repetir automaticamente sem número definido de parcelas'}
                      </p>
                    </div>
                  </label>
                </motion.div>
              )}
            </div>
          )}

          {editingTransaction?.installmentId && (
            <div className="p-4 bg-emerald-50 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {editingTransaction.totalInstallments === null ? 'Editar série indefinida:' : 'Editar parcelas:'}
              </p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-emerald-700">
                  <input type="radio" checked={editMode === 'only'} onChange={() => setEditMode('only')} />
                  Apenas esta
                </label>
                <label className="flex items-center gap-2 text-sm text-emerald-700">
                  <input type="radio" checked={editMode === 'future'} onChange={() => setEditMode('future')} />
                  Esta e futuras
                </label>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer">
            <input
              type="checkbox"
              checked={isConsolidated}
              onChange={(e) => setIsConsolidated(e.target.checked)}
              className={cn(
                'w-5 h-5 rounded-lg border-slate-300 focus:ring-2 transition-all',
                type === 'income'
                  ? 'text-emerald-600 focus:ring-emerald-500'
                  : type === 'expense'
                    ? 'text-rose-600 focus:ring-rose-500'
                    : 'text-violet-600 focus:ring-violet-500'
              )}
            />
            <span className="font-bold text-slate-700">Lançamento Consolidado</span>
          </label>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'w-full py-5 rounded-[2rem] text-white font-black text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100',
              type === 'income'
                ? 'bg-emerald-600 shadow-emerald-200'
                : type === 'expense'
                  ? 'bg-rose-600 shadow-rose-200'
                  : 'bg-violet-600 shadow-violet-200'
            )}
          >
            {isSaving ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : `Confirmar ${typeLabel}`}
          </button>

          {editingTransaction && (
            <button
              onClick={() => onDelete(editingTransaction)}
              className="w-full py-4 text-rose-600 font-bold hover:bg-rose-50 rounded-2xl transition-colors"
            >
              Excluir Lançamento
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
