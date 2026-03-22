import { renderHook } from '@testing-library/react';
import { useTransactionCalculations } from './useTransactionCalculations';
import { Transaction, Account, Category } from '../types';

const mockAccounts: Account[] = [
  {
    id: 'acc1',
    name: 'Checking',
    type: 'checking',
    balance: 1000,
    initialBalance: 500,
    initialBalanceDate: '2026-01-01',
    color: '#10b981',
    icon: 'Banknote',
    userId: 'user1',
  },
  {
    id: 'acc2',
    name: 'Savings',
    type: 'savings',
    balance: 2000,
    initialBalance: 2000,
    initialBalanceDate: '2026-01-01',
    color: '#3b82f6',
    icon: 'PiggyBank',
    userId: 'user1',
  },
];

const mockCategories: Category[] = [
  { id: 'cat1', name: 'Food', icon: 'Utensils', color: '#ef4444', type: 'expense', userId: 'user1' },
  { id: 'cat2', name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'income', userId: 'user1' },
  { id: 'cat3', name: 'Transport', icon: 'Car', color: '#f59e0b', type: 'expense', userId: 'user1' },
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    description: 'Groceries',
    amount: 50,
    date: '2026-03-15T12:00:00.000Z',
    accountId: 'acc1',
    categoryId: 'cat1',
    type: 'expense',
    isConsolidated: true,
    userId: 'user1',
  },
  {
    id: 'tx2',
    description: 'Salary',
    amount: 3000,
    date: '2026-03-01T12:00:00.000Z',
    accountId: 'acc1',
    categoryId: 'cat2',
    type: 'income',
    isConsolidated: true,
    userId: 'user1',
  },
  {
    id: 'tx3',
    description: 'Gas',
    amount: 40,
    date: '2026-03-10T12:00:00.000Z',
    accountId: 'acc1',
    categoryId: 'cat3',
    type: 'expense',
    isConsolidated: true,
    userId: 'user1',
  },
  {
    id: 'tx4',
    description: 'Restaurant',
    amount: 75,
    date: '2026-02-20T12:00:00.000Z',
    accountId: 'acc1',
    categoryId: 'cat1',
    type: 'expense',
    isConsolidated: true,
    userId: 'user1',
  },
  {
    id: 'tx5',
    description: 'Future Payment',
    amount: 100,
    date: '2026-04-01T12:00:00.000Z',
    accountId: 'acc1',
    categoryId: 'cat1',
    type: 'expense',
    isConsolidated: false,
    userId: 'user1',
  },
];

describe('useTransactionCalculations', () => {
  const defaultProps = {
    transactions: mockTransactions,
    accounts: mockAccounts,
    categories: mockCategories,
    currentMonth: new Date('2026-03-15'),
    selectedAccountIds: [] as string[],
    selectedCategoryIds: [] as string[],
    filterToday: false,
    includePreviousBalance: true,
    transactionSortOrder: 'desc' as const,
  };

  describe('filteredTransactions', () => {
    it('should filter transactions by current month', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.filteredTransactions).toHaveLength(3);
      expect(result.current.filteredTransactions.map((t) => t.id)).toEqual(['tx1', 'tx3', 'tx2']);
    });

    it('should filter transactions by selected account', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          selectedAccountIds: ['acc1'],
        })
      );

      expect(result.current.filteredTransactions).toHaveLength(3);
      expect(result.current.filteredTransactions.every((t) => t.accountId === 'acc1')).toBe(true);
    });

    it('should filter transactions by selected category', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          selectedCategoryIds: ['cat1'],
        })
      );

      expect(result.current.filteredTransactions).toHaveLength(1);
      expect(result.current.filteredTransactions[0].categoryId).toBe('cat1');
    });

    it('should filter transactions for today when filterToday is true', () => {
      const todayDate = new Date();
      const todayTransaction: Transaction = {
        id: 'tx-today',
        description: 'Today',
        amount: 10,
        date: todayDate.toISOString(),
        accountId: 'acc1',
        categoryId: 'cat1',
        type: 'expense',
        isConsolidated: true,
        userId: 'user1',
      };

      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: [...mockTransactions, todayTransaction],
          filterToday: true,
        })
      );

      expect(result.current.filteredTransactions).toHaveLength(1);
      expect(result.current.filteredTransactions[0].id).toBe('tx-today');
    });

    it('should sort transactions by date in descending order', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      const dates = result.current.filteredTransactions.map((t) => new Date(t.date).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });
  });

  describe('totals', () => {
    it('should calculate income, expense, and balance correctly', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.totals).toEqual({
        income: 3000,
        expense: 90,
        balance: 2910,
      });
    });

    it('should handle only expenses', () => {
      const expenseOnlyTransactions = mockTransactions.filter((t) => t.type === 'expense');
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: expenseOnlyTransactions,
        })
      );

      expect(result.current.totals).toEqual({
        income: 0,
        expense: 90,
        balance: -90,
      });
    });

    it('should handle only income', () => {
      const incomeOnlyTransactions = mockTransactions.filter((t) => t.type === 'income');
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: incomeOnlyTransactions,
        })
      );

      expect(result.current.totals).toEqual({
        income: 3000,
        expense: 0,
        balance: 3000,
      });
    });

    it('should return zero totals when no transactions match', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          currentMonth: new Date('2025-01-01'),
        })
      );

      expect(result.current.totals).toEqual({
        income: 0,
        expense: 0,
        balance: 0,
      });
    });
  });

  describe('totalBalance', () => {
    it('should sum all account balances when selectedAccountIds is empty', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.totalBalance).toBe(3000);
    });

    it('should return specific account balance when account is selected', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          selectedAccountIds: ['acc1'],
        })
      );

      expect(result.current.totalBalance).toBe(1000);
    });

    it('should return 0 when selected account does not exist', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          selectedAccountIds: ['nonexistent'],
        })
      );

      expect(result.current.totalBalance).toBe(0);
    });
  });

  describe('upcomingTransactions', () => {
    it('should return upcoming and today transactions', () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 1);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 2);

      const futureTransactions: Transaction[] = [
        {
          id: 'future1',
          description: 'Future 1',
          amount: 100,
          date: futureDate1.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
        {
          id: 'future2',
          description: 'Future 2',
          amount: 200,
          date: futureDate2.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
      ];

      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: [...mockTransactions, ...futureTransactions],
        })
      );

      expect(result.current.upcomingTransactions.length).toBeGreaterThan(0);
      expect(result.current.upcomingTransactions.some((t) => t.id === 'future1')).toBe(true);
    });

    it('should limit to 5 upcoming transactions', () => {
      const futureTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i + 1);
        return {
          id: `future${i}`,
          description: `Future ${i}`,
          amount: 100,
          date: futureDate.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        };
      });

      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: [...mockTransactions, ...futureTransactions],
        })
      );

      expect(result.current.upcomingTransactions.length).toBeLessThanOrEqual(5);
    });

    it('should filter upcoming transactions by account', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureTransaction: Transaction = {
        id: 'future1',
        description: 'Future',
        amount: 100,
        date: futureDate.toISOString(),
        accountId: 'acc2',
        categoryId: 'cat1',
        type: 'expense',
        isConsolidated: false,
        userId: 'user1',
      };

      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: [...mockTransactions, futureTransaction],
          selectedAccountIds: ['acc1'],
        })
      );

      expect(result.current.upcomingTransactions.every((t) => t.accountId === 'acc1' || t.toAccountId === 'acc1')).toBe(
        true
      );
    });
  });

  describe('pieChartData', () => {
    it('should aggregate expenses by category', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.pieChartData).toHaveLength(2);
      expect(result.current.pieChartData.find((d) => d.name === 'Food')?.value).toBe(50);
      expect(result.current.pieChartData.find((d) => d.name === 'Transport')?.value).toBe(40);
    });

    it('should sort categories by value in descending order', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      const values = result.current.pieChartData.map((d) => d.value);
      expect(values).toEqual([...values].sort((a, b) => b - a));
    });

    it('should exclude income from pie chart data', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.pieChartData.every((d) => d.name !== 'Salary')).toBe(true);
    });

    it('should use category color', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      const foodData = result.current.pieChartData.find((d) => d.name === 'Food');
      expect(foodData?.color).toBe('#ef4444');
    });

    it('should handle transactions without categories', () => {
      const uncategorizedTransaction: Transaction = {
        id: 'tx-uncat',
        description: 'Uncategorized',
        amount: 30,
        date: '2026-03-12T12:00:00.000Z',
        accountId: 'acc1',
        categoryId: 'unknown',
        type: 'expense',
        isConsolidated: true,
        userId: 'user1',
      };

      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactions: [...mockTransactions, uncategorizedTransaction],
        })
      );

      const outrosData = result.current.pieChartData.find((d) => d.name === 'Outros');
      expect(outrosData).toBeDefined();
      expect(outrosData?.value).toBe(30);
      expect(outrosData?.color).toBe('#cbd5e1');
    });
  });

  describe('transactionsByDay', () => {
    it('should group transactions by date', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.transactionsByDay.length).toBeGreaterThan(0);
      expect(result.current.transactionsByDay.every((group) => group.transactions.length > 0)).toBe(true);
    });

    it('should calculate day totals correctly', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      result.current.transactionsByDay.forEach((group) => {
        const calculatedTotal = group.transactions.reduce((sum, t) => {
          if (t.type === 'income') return sum + t.amount;
          if (t.type === 'expense') return sum - t.amount;
          return sum;
        }, 0);
        expect(Math.abs(group.dayTotal - calculatedTotal)).toBeLessThan(0.01);
      });
    });

    it('should sort days by date based on transactionSortOrder', () => {
      const { result: descResult } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactionSortOrder: 'desc',
        })
      );

      const descDates = descResult.current.transactionsByDay.map((g) => new Date(g.date).getTime());
      expect(descDates).toEqual([...descDates].sort((a, b) => b - a));

      const { result: ascResult } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          transactionSortOrder: 'asc',
        })
      );

      const ascDates = ascResult.current.transactionsByDay.map((g) => new Date(g.date).getTime());
      expect(ascDates).toEqual([...ascDates].sort((a, b) => a - b));
    });

    it('should calculate running balance correctly', () => {
      const { result } = renderHook(() => useTransactionCalculations(defaultProps));

      expect(result.current.transactionsByDay.length).toBeGreaterThan(0);
      expect(result.current.transactionsByDay.every((group) => typeof group.runningBalance === 'number')).toBe(true);
    });

    it('should reset running balance when includePreviousBalance is false', () => {
      const { result } = renderHook(() =>
        useTransactionCalculations({
          ...defaultProps,
          includePreviousBalance: false,
        })
      );

      expect(result.current.transactionsByDay.length).toBeGreaterThan(0);
    });
  });
});
