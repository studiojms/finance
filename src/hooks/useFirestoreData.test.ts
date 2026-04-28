import { renderHook, waitFor } from '@testing-library/react';
import { useFirestoreData } from './useFirestoreData';
import { DatabaseService } from '../services/databaseService';
import { DEFAULT_CATEGORIES } from '../constants';

vi.mock('../config', () => ({
  isFirebase: vi.fn(() => true),
  isSupabase: vi.fn(() => false),
}));

vi.mock('../services/databaseService', () => ({
  DatabaseService: {
    subscribeToCollection: vi.fn((collection, userId, constraints, callback) => {
      callback([]);
      return vi.fn();
    }),
    queryDocuments: vi.fn().mockResolvedValue([]),
    addDocument: vi.fn().mockResolvedValue('mock-id'),
  },
}));

vi.mock('../constants', () => ({
  DEFAULT_CATEGORIES: [
    { name: 'Salary', icon: 'DollarSign', color: '#10b981', type: 'income' },
    { name: 'Groceries', icon: 'ShoppingCart', color: '#ef4444', type: 'expense' },
  ],
}));

describe('useFirestoreData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to accounts, transactions, and categories', () => {
    renderHook(() => useFirestoreData('user1'));

    expect(DatabaseService.subscribeToCollection).toHaveBeenCalledWith('accounts', 'user1', [], expect.any(Function));
    expect(DatabaseService.subscribeToCollection).toHaveBeenCalledWith(
      'transactions',
      'user1',
      [],
      expect.any(Function)
    );
    expect(DatabaseService.subscribeToCollection).toHaveBeenCalledWith('categories', 'user1', [], expect.any(Function));
  });

  it('seeds default categories if none exist', async () => {
    (DatabaseService.queryDocuments as any).mockResolvedValue([]);

    renderHook(() => useFirestoreData('user1'));

    await waitFor(() => {
      expect(DatabaseService.addDocument).toHaveBeenCalledTimes(DEFAULT_CATEGORIES.length);
    });
  });

  it('does not seed categories if they already exist', async () => {
    (DatabaseService.queryDocuments as any).mockResolvedValue([{ id: 'cat1', name: 'Existing' }]);

    renderHook(() => useFirestoreData('user1'));

    await waitFor(() => {
      expect(DatabaseService.addDocument).not.toHaveBeenCalled();
    });
  });

  it('returns empty arrays initially', () => {
    const { result } = renderHook(() => useFirestoreData('user1'));

    expect(result.current.accounts).toEqual([]);
    expect(result.current.transactions).toEqual([]);
    expect(result.current.categories).toEqual([]);
  });

  it('unsubscribes on unmount', () => {
    const unsubscribeMock = vi.fn();
    (DatabaseService.subscribeToCollection as any).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useFirestoreData('user1'));

    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(3);
  });

  it('handles null userId', () => {
    renderHook(() => useFirestoreData(null));

    expect(DatabaseService.subscribeToCollection).not.toHaveBeenCalled();
  });
});
