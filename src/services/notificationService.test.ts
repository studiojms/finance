import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notificationService';
import { Transaction } from '../types';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('checkOverdueTransactions', () => {
    it('returns overdue unconsolidated transactions', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Overdue transaction',
          amount: 100,
          date: yesterday.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
        {
          id: '2',
          description: 'Consolidated transaction',
          amount: 200,
          date: yesterday.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: true,
          userId: 'user1',
        },
        {
          id: '3',
          description: 'Future transaction',
          amount: 300,
          date: new Date(Date.now() + 86400000).toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
      ];

      const overdue = NotificationService.checkOverdueTransactions(transactions);

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });

    it('returns empty array when no overdue transactions', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Future transaction',
          amount: 100,
          date: tomorrow.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
      ];

      const overdue = NotificationService.checkOverdueTransactions(transactions);

      expect(overdue).toHaveLength(0);
    });

    it('excludes consolidated transactions even if overdue', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Consolidated overdue',
          amount: 100,
          date: yesterday.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: true,
          userId: 'user1',
        },
      ];

      const overdue = NotificationService.checkOverdueTransactions(transactions);

      expect(overdue).toHaveLength(0);
    });

    it('returns multiple overdue transactions', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Overdue 1',
          amount: 100,
          date: twoDaysAgo.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
        {
          id: '2',
          description: 'Overdue 2',
          amount: 200,
          date: yesterday.toISOString(),
          accountId: 'acc1',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: false,
          userId: 'user1',
        },
      ];

      const overdue = NotificationService.checkOverdueTransactions(transactions);

      expect(overdue).toHaveLength(2);
    });
  });

  describe('isSupported', () => {
    it('checks if notifications are supported in the environment', () => {
      const supported = NotificationService.isSupported();

      // In test environment, this depends on the setup
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('hasPermission', () => {
    it('returns false initially', () => {
      const hasPermission = NotificationService.hasPermission();

      expect(hasPermission).toBe(false);
    });
  });
});
