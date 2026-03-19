import { useMemo } from 'react';
import { parseISO, isSameMonth, isToday, isAfter, isSameDay, startOfMonth, startOfDay } from 'date-fns';
import { Transaction, Account, Category } from '../types';

export interface TransactionTotals {
  income: number;
  expense: number;
  balance: number;
}

export interface DayGroup {
  date: string;
  transactions: Transaction[];
  dayTotal: number;
  runningBalance: number;
}

export interface UseTransactionCalculationsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currentMonth: Date;
  selectedAccountId: string | 'all';
  selectedCategoryId: string | 'all';
  filterToday: boolean;
  includePreviousBalance: boolean;
  transactionSortOrder: 'asc' | 'desc';
}

export interface UseTransactionCalculationsReturn {
  filteredTransactions: Transaction[];
  totals: TransactionTotals;
  totalBalance: number;
  upcomingTransactions: Transaction[];
  transactionsByDay: DayGroup[];
  pieChartData: { name: string; value: number; color: string }[];
}

export function useTransactionCalculations({
  transactions,
  accounts,
  categories,
  currentMonth,
  selectedAccountId,
  selectedCategoryId,
  filterToday,
  includePreviousBalance,
  transactionSortOrder,
}: UseTransactionCalculationsProps): UseTransactionCalculationsReturn {
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const tDate = parseISO(t.date);
        const dateMatch = filterToday ? isToday(tDate) : isSameMonth(tDate, currentMonth);
        const accountMatch =
          selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
        const categoryMatch = selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
        return dateMatch && accountMatch && categoryMatch;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, currentMonth, selectedAccountId, selectedCategoryId, filterToday]);

  const totals = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const totalBalance = useMemo(() => {
    if (selectedAccountId !== 'all') {
      return accounts.find((a) => a.id === selectedAccountId)?.balance || 0;
    }
    return accounts.reduce((acc, a) => acc + a.balance, 0);
  }, [accounts, selectedAccountId]);

  const upcomingTransactions = useMemo(() => {
    const today = startOfDay(new Date());
    return transactions
      .filter((t) => {
        const tDate = parseISO(t.date);
        return isAfter(tDate, today) || isSameDay(tDate, today);
      })
      .filter((t) => {
        const accountMatch =
          selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;
        const categoryMatch = selectedCategoryId === 'all' || t.categoryId === selectedCategoryId;
        return accountMatch && categoryMatch;
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [transactions, selectedAccountId, selectedCategoryId]);

  const transactionsByDay = useMemo(() => {
    const consolidatedSum = transactions.reduce((acc, t) => {
      if (!t.isConsolidated) return acc;

      const account = accounts.find((a) => a.id === t.accountId);
      const toAccount = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;

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

    const startOfView = filterToday ? startOfDay(new Date()) : startOfMonth(currentMonth);
    const allSorted = [...transactions].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    allSorted
      .filter((t) => {
        const tDate = parseISO(t.date);
        const accountMatch =
          selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;

        const account = accounts.find((a) => a.id === t.accountId);
        const toAccount = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;
        if (account && t.date < account.initialBalanceDate) return false;
        if (t.type === 'transfer' && toAccount && t.date < toAccount.initialBalanceDate) return false;

        return tDate < startOfView && accountMatch;
      })
      .forEach((t) => {
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

    const inViewTransactions = allSorted.filter((t) => {
      const tDate = parseISO(t.date);
      const accountMatch =
        selectedAccountId === 'all' || t.accountId === selectedAccountId || t.toAccountId === selectedAccountId;

      const account = accounts.find((a) => a.id === t.accountId);
      const toAccount = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null;
      if (account && t.date < account.initialBalanceDate) return false;
      if (t.type === 'transfer' && toAccount && t.date < toAccount.initialBalanceDate) return false;

      const isInView = filterToday ? isToday(tDate) : isSameMonth(tDate, currentMonth);
      return isInView && accountMatch;
    });

    const groups: DayGroup[] = [];

    inViewTransactions.forEach((t) => {
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
        let group = groups.find((g) => g.date === dateStr);
        if (!group) {
          group = { date: dateStr, transactions: [], dayTotal: 0, runningBalance: 0 };
          groups.push(group);
        }
        group.transactions.push(t);
        group.dayTotal += amount;
        group.runningBalance = runningBalance;
      }
    });

    return groups.sort((a, b) => {
      const timeA = parseISO(a.date).getTime();
      const timeB = parseISO(b.date).getTime();
      return transactionSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [
    transactions,
    accounts,
    includePreviousBalance,
    currentMonth,
    filterToday,
    selectedAccountId,
    selectedCategoryId,
    totalBalance,
    transactionSortOrder,
  ]);

  const pieChartData = useMemo(() => {
    const data: { [key: string]: { name: string; value: number; color: string } } = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat?.name || 'Outros';
        if (!data[name]) {
          data[name] = { name, value: 0, color: cat?.color || '#cbd5e1' };
        }
        data[name].value += t.amount;
      });
    return Object.values(data).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories]);

  return {
    filteredTransactions,
    totals,
    totalBalance,
    upcomingTransactions,
    transactionsByDay,
    pieChartData,
  };
}
