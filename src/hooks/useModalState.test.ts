import { renderHook, act } from '@testing-library/react';
import { useModalState } from './useModalState';
import { Transaction, Account, Category } from '../types';

const mockTransaction: Transaction = {
  id: 'tx1',
  description: 'Test Transaction',
  amount: 50,
  date: '2026-03-15T12:00:00.000Z',
  accountId: 'acc1',
  categoryId: 'cat1',
  type: 'expense',
  isConsolidated: true,
  userId: 'user1',
};

const mockAccount: Account = {
  id: 'acc1',
  name: 'Checking',
  type: 'checking',
  balance: 1000,
  initialBalance: 500,
  initialBalanceDate: '2026-01-01',
  color: '#10b981',
  icon: 'Banknote',
  userId: 'user1',
};

const mockCategory: Category = {
  id: 'cat1',
  name: 'Food',
  icon: 'Utensils',
  color: '#ef4444',
  type: 'expense',
  userId: 'user1',
};

describe('useModalState', () => {
  describe('Transaction Modal', () => {
    it('should initialize with transaction modal closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isTransactionModalOpen).toBe(false);
      expect(result.current.editingTransaction).toBeNull();
      expect(result.current.initialTransactionType).toBe('expense');
    });

    it('should open transaction modal with default expense type', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openTransactionModal();
      });

      expect(result.current.isTransactionModalOpen).toBe(true);
      expect(result.current.initialTransactionType).toBe('expense');
      expect(result.current.editingTransaction).toBeNull();
    });

    it('should open transaction modal with income type', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openTransactionModal('income');
      });

      expect(result.current.isTransactionModalOpen).toBe(true);
      expect(result.current.initialTransactionType).toBe('income');
    });

    it('should open transaction modal for editing', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openTransactionModal('expense', mockTransaction);
      });

      expect(result.current.isTransactionModalOpen).toBe(true);
      expect(result.current.editingTransaction).toEqual(mockTransaction);
    });

    it('should close transaction modal and clear editing state', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openTransactionModal('expense', mockTransaction);
      });

      expect(result.current.isTransactionModalOpen).toBe(true);

      act(() => {
        result.current.closeTransactionModal();
      });

      expect(result.current.isTransactionModalOpen).toBe(false);
      expect(result.current.editingTransaction).toBeNull();
    });
  });

  describe('Account Modal', () => {
    it('should initialize with account modal closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isAccountModalOpen).toBe(false);
      expect(result.current.editingAccount).toBeNull();
    });

    it('should open account modal for creating new account', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openAccountModal();
      });

      expect(result.current.isAccountModalOpen).toBe(true);
      expect(result.current.editingAccount).toBeNull();
    });

    it('should open account modal for editing', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openAccountModal(mockAccount);
      });

      expect(result.current.isAccountModalOpen).toBe(true);
      expect(result.current.editingAccount).toEqual(mockAccount);
    });

    it('should close account modal and clear editing state', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openAccountModal(mockAccount);
      });

      expect(result.current.isAccountModalOpen).toBe(true);

      act(() => {
        result.current.closeAccountModal();
      });

      expect(result.current.isAccountModalOpen).toBe(false);
      expect(result.current.editingAccount).toBeNull();
    });
  });

  describe('Settings Modal', () => {
    it('should initialize with settings modal closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isSettingsOpen).toBe(false);
    });

    it('should open settings modal', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openSettings();
      });

      expect(result.current.isSettingsOpen).toBe(true);
    });

    it('should close settings modal', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openSettings();
      });

      act(() => {
        result.current.closeSettings();
      });

      expect(result.current.isSettingsOpen).toBe(false);
    });
  });

  describe('Quick Action Popup', () => {
    it('should initialize with quick action popup closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isQuickActionOpen).toBe(false);
    });

    it('should open quick action popup', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openQuickAction();
      });

      expect(result.current.isQuickActionOpen).toBe(true);
    });

    it('should close quick action popup', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openQuickAction();
      });

      act(() => {
        result.current.closeQuickAction();
      });

      expect(result.current.isQuickActionOpen).toBe(false);
    });
  });

  describe('Confirmation Modal', () => {
    it('should initialize with confirmation modal closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.confirmModal.isOpen).toBe(false);
      expect(result.current.confirmModal.title).toBe('');
      expect(result.current.confirmModal.message).toBe('');
    });

    it('should open confirmation modal with title, message, and callback', () => {
      const { result } = renderHook(() => useModalState());
      const onConfirmMock = vi.fn();

      act(() => {
        result.current.openConfirm('Delete Transaction', 'Are you sure?', onConfirmMock);
      });

      expect(result.current.confirmModal.isOpen).toBe(true);
      expect(result.current.confirmModal.title).toBe('Delete Transaction');
      expect(result.current.confirmModal.message).toBe('Are you sure?');
      expect(result.current.confirmModal.onConfirm).toBe(onConfirmMock);
    });

    it('should execute onConfirm callback when called', () => {
      const { result } = renderHook(() => useModalState());
      const onConfirmMock = vi.fn();

      act(() => {
        result.current.openConfirm('Delete Transaction', 'Are you sure?', onConfirmMock);
      });

      act(() => {
        result.current.confirmModal.onConfirm();
      });

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it('should close confirmation modal', () => {
      const { result } = renderHook(() => useModalState());
      const onConfirmMock = vi.fn();

      act(() => {
        result.current.openConfirm('Delete Transaction', 'Are you sure?', onConfirmMock);
      });

      expect(result.current.confirmModal.isOpen).toBe(true);

      act(() => {
        result.current.closeConfirm();
      });

      expect(result.current.confirmModal.isOpen).toBe(false);
      expect(result.current.confirmModal.title).toBe('Delete Transaction');
      expect(result.current.confirmModal.message).toBe('Are you sure?');
    });
  });

  describe('Category Modal', () => {
    it('should initialize with category modal closed', () => {
      const { result } = renderHook(() => useModalState());

      expect(result.current.isCategoryModalOpen).toBe(false);
      expect(result.current.editingCategory).toBeNull();
    });

    it('should open category modal for creating new category', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCategoryModal();
      });

      expect(result.current.isCategoryModalOpen).toBe(true);
      expect(result.current.editingCategory).toBeNull();
    });

    it('should open category modal for editing', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCategoryModal(mockCategory);
      });

      expect(result.current.isCategoryModalOpen).toBe(true);
      expect(result.current.editingCategory).toEqual(mockCategory);
    });

    it('should close category modal and clear editing state', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCategoryModal(mockCategory);
      });

      expect(result.current.isCategoryModalOpen).toBe(true);

      act(() => {
        result.current.closeCategoryModal();
      });

      expect(result.current.isCategoryModalOpen).toBe(false);
      expect(result.current.editingCategory).toBeNull();
    });
  });

  describe('Integration', () => {
    it('should handle multiple modals independently', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openTransactionModal();
        result.current.openSettings();
        result.current.openQuickAction();
      });

      expect(result.current.isTransactionModalOpen).toBe(true);
      expect(result.current.isSettingsOpen).toBe(true);
      expect(result.current.isQuickActionOpen).toBe(true);

      act(() => {
        result.current.closeTransactionModal();
      });

      expect(result.current.isTransactionModalOpen).toBe(false);
      expect(result.current.isSettingsOpen).toBe(true);
      expect(result.current.isQuickActionOpen).toBe(true);
    });

    it('should handle quick action to transaction modal workflow', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openQuickAction();
      });

      expect(result.current.isQuickActionOpen).toBe(true);

      act(() => {
        result.current.closeQuickAction();
        result.current.openTransactionModal('income');
      });

      expect(result.current.isQuickActionOpen).toBe(false);
      expect(result.current.isTransactionModalOpen).toBe(true);
      expect(result.current.initialTransactionType).toBe('income');
    });
  });
});
