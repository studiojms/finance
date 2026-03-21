import { useState, useCallback } from 'react';
import { Transaction, Account, TransactionType, Category } from '../types';

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export interface InstallmentDeleteModalState {
  isOpen: boolean;
  transaction: Transaction | null;
  onConfirm: (mode: 'only' | 'future') => void;
}

export interface UseModalStateReturn {
  // Transaction Modal
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  initialTransactionType: TransactionType;
  openTransactionModal: (type?: TransactionType, transaction?: Transaction | null) => void;
  closeTransactionModal: () => void;

  // Account Modal
  isAccountModalOpen: boolean;
  editingAccount: Account | null;
  openAccountModal: (account?: Account | null) => void;
  closeAccountModal: () => void;

  // Category Modal
  isCategoryModalOpen: boolean;
  editingCategory: Category | null;
  openCategoryModal: (category?: Category | null) => void;
  closeCategoryModal: () => void;

  // Settings Modal
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Quick Action Popup
  isQuickActionOpen: boolean;
  openQuickAction: () => void;
  closeQuickAction: () => void;

  // Confirmation Modal
  confirmModal: ConfirmationModalState;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;

  // Installment Delete Modal
  installmentDeleteModal: InstallmentDeleteModalState;
  openInstallmentDelete: (transaction: Transaction, onConfirm: (mode: 'only' | 'future') => void) => void;
  closeInstallmentDelete: () => void;
}

export function useModalState(): UseModalStateReturn {
  // Transaction Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>('expense');

  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Quick Action Popup State
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Installment Delete Modal State
  const [installmentDeleteModal, setInstallmentDeleteModal] = useState<InstallmentDeleteModalState>({
    isOpen: false,
    transaction: null,
    onConfirm: () => {},
  });

  // Transaction Modal Handlers
  const openTransactionModal = useCallback(
    (type: TransactionType = 'expense', transaction: Transaction | null = null) => {
      setInitialTransactionType(type);
      setEditingTransaction(transaction);
      setIsTransactionModalOpen(true);
    },
    []
  );

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // Account Modal Handlers
  const openAccountModal = useCallback((account: Account | null = null) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  }, []);

  // Category Modal Handlers
  const openCategoryModal = useCallback((category: Category | null = null) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  }, []);

  // Settings Modal Handlers
  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  // Quick Action Popup Handlers
  const openQuickAction = useCallback(() => {
    setIsQuickActionOpen(true);
  }, []);

  const closeQuickAction = useCallback(() => {
    setIsQuickActionOpen(false);
  }, []);

  // Confirmation Modal Handlers
  const openConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Installment Delete Modal Handlers
  const openInstallmentDelete = useCallback(
    (transaction: Transaction, onConfirm: (mode: 'only' | 'future') => void) => {
      setInstallmentDeleteModal({ isOpen: true, transaction, onConfirm });
    },
    []
  );

  const closeInstallmentDelete = useCallback(() => {
    setInstallmentDeleteModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // Transaction Modal
    isTransactionModalOpen,
    editingTransaction,
    initialTransactionType,
    openTransactionModal,
    closeTransactionModal,

    // Account Modal
    isAccountModalOpen,
    editingAccount,
    openAccountModal,
    closeAccountModal,

    // Category Modal
    isCategoryModalOpen,
    editingCategory,
    openCategoryModal,
    closeCategoryModal,

    // Settings Modal
    isSettingsOpen,
    openSettings,
    closeSettings,

    // Quick Action Popup
    isQuickActionOpen,
    openQuickAction,
    closeQuickAction,

    // Confirmation Modal
    confirmModal,
    openConfirm,
    closeConfirm,

    // Installment Delete Modal
    installmentDeleteModal,
    openInstallmentDelete,
    closeInstallmentDelete,
  };
}
