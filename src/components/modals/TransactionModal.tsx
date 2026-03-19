import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, collection, addDoc, updateDoc, writeBatch, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Account, Transaction, Category, TransactionType } from '../../types';
import { handleFirestoreError } from '../../services/errorService';
import { formatCurrency, cn } from '../../utils';

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
  isOpen,
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
  const [accountId, setAccountId] = useState(editingTransaction?.accountId || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId || '');
  const [toAccountId, setToAccountId] = useState(editingTransaction?.toAccountId || '');
  const [frequency, setFrequency] = useState<
    'daily' | 'weekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
  >((editingTransaction?.frequency as any) || 'monthly');
  const [installments, setInstallments] = useState(editingTransaction?.totalInstallments?.toString() || '1');
  const [isConsolidated, setIsConsolidated] = useState(editingTransaction?.isConsolidated || false);
  const [editMode, setEditMode] = useState<'only' | 'future'>('only');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Transaction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSelectedSuggestion, setLastSelectedSuggestion] = useState<string | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value || '0');
  };

  const displayAmount = (parseFloat(amount) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleSave = async () => {
    const numericAmount = parseFloat(amount) / 100;
    if (!description || numericAmount <= 0 || !accountId || (type === 'transfer' && !toAccountId)) return;
    if (isSaving) return;

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

      const updateBalance = (t: any, isNew: boolean, oldT?: Transaction) => {
        if (!t.isConsolidated && (!oldT || !oldT.isConsolidated)) return;

        if (isNew) {
          if (t.type === 'transfer') {
            batch.update(doc(db, 'accounts', t.accountId), { balance: increment(-t.amount) });
            batch.update(doc(db, 'accounts', t.toAccountId), { balance: increment(t.amount) });
          } else {
            const diff = t.type === 'income' ? t.amount : -t.amount;
            batch.update(doc(db, 'accounts', t.accountId), { balance: increment(diff) });
          }
        } else if (oldT) {
          if (oldT.isConsolidated) {
            if (oldT.type === 'transfer') {
              batch.update(doc(db, 'accounts', oldT.accountId), { balance: increment(oldT.amount) });
              batch.update(doc(db, 'accounts', oldT.toAccountId!), { balance: increment(-oldT.amount) });
            } else {
              const diff = oldT.type === 'income' ? -oldT.amount : oldT.amount;
              batch.update(doc(db, 'accounts', oldT.accountId), { balance: increment(diff) });
            }
          }
          if (t.isConsolidated) {
            if (t.type === 'transfer') {
              batch.update(doc(db, 'accounts', t.accountId), { balance: increment(-t.amount) });
              batch.update(doc(db, 'accounts', t.toAccountId), { balance: increment(t.amount) });
            } else {
              const diff = t.type === 'income' ? t.amount : -t.amount;
              batch.update(doc(db, 'accounts', t.accountId), { balance: increment(diff) });
            }
          }
        }
      };

      if (editingTransaction) {
        if (editMode === 'future' && editingTransaction.installmentId) {
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

            // Add installment suffix to description if we have totalInstallments
            const descriptionWithSuffix = dData.totalInstallments 
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
        const numInstallments = parseInt(installments);
        if (numInstallments > 1) {
          const installmentId = crypto.randomUUID();
          for (let i = 0; i < numInstallments; i++) {
            const installmentDate = getNextDate(new Date(date), frequency, i);
            const tRef = doc(collection(db, 'transactions'));
            // Add installment suffix to description (i/n)
            const descriptionWithSuffix = `${description} (${i + 1}/${numInstallments})`;
            const newT = {
              ...baseTransaction,
              description: descriptionWithSuffix,
              date: installmentDate.toISOString(),
              installmentId,
              installmentNumber: i + 1,
              totalInstallments: numInstallments,
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
    } catch (err) {
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
              <input
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

          <div className={cn('grid gap-4', type === 'transfer' ? 'grid-cols-1' : 'grid-cols-2')}>
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
                  {accounts.map((a) => (
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
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {type !== 'transfer' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value="">Selecionar...</option>
                {categories
                  .filter((c) => c.type === type || c.type === 'both')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        {type === 'transfer' ? 'Repetições' : 'Parcelas'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Frequência
                      </label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value as any)}
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
                </motion.div>
              )}
            </div>
          )}

          {editingTransaction?.installmentId && (
            <div className="p-4 bg-emerald-50 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Editar parcelas:</p>
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
