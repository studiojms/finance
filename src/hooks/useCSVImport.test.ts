import { renderHook, waitFor } from '@testing-library/react';
import { useCSVImport } from './useCSVImport';
import { DatabaseService } from '../services/databaseService';
import { CSVService } from '../services/csvService';
import { Account, Category } from '../types';

vi.mock('../config', () => ({
  isFirebase: vi.fn(() => true),
  isSupabase: vi.fn(() => false),
}));

vi.mock('../services/databaseService', () => ({
  DatabaseService: {
    executeBatchWrite: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/csvService', () => ({
  CSVService: {
    readCSVFile: vi.fn(),
    parseCSVContent: vi.fn(),
    parseDate: vi.fn(),
    parseAmount: vi.fn(),
  },
}));

describe('useCSVImport', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Checking',
      type: 'checking',
      balance: 1000,
      initialBalance: 0,
      initialBalanceDate: '2024-01-01',
      color: '#94a3b8',
      icon: 'Wallet',
      userId: 'user1',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Groceries',
      icon: 'ShoppingCart',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports transactions from CSV file', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockRows = [
      {
        date: '2024-01-15',
        description: 'Grocery shopping',
        amount: '-50.00',
        account: 'Checking',
        category: 'Groceries',
      },
    ];

    (CSVService.readCSVFile as any).mockResolvedValue('csv content');
    (CSVService.parseCSVContent as any).mockReturnValue(mockRows);
    (CSVService.parseDate as any).mockReturnValue(new Date('2024-01-15'));
    (CSVService.parseAmount as any).mockReturnValue(-50);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(result.current.importStatus).toBe('success');
      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
    });
  });

  it('creates new accounts if they do not exist', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockRows = [
      {
        date: '2024-01-15',
        description: 'Test',
        amount: '-50.00',
        account: 'New Account',
        category: 'Groceries',
      },
    ];

    (CSVService.readCSVFile as any).mockResolvedValue('csv content');
    (CSVService.parseCSVContent as any).mockReturnValue(mockRows);
    (CSVService.parseDate as any).mockReturnValue(new Date('2024-01-15'));
    (CSVService.parseAmount as any).mockReturnValue(-50);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const accountCreation = operations.find((op: any) => op.type === 'create' && op.collection === 'accounts');
      expect(accountCreation).toBeDefined();
    });
  });

  it('creates new categories if they do not exist', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockRows = [
      {
        date: '2024-01-15',
        description: 'Test',
        amount: '-50.00',
        account: 'Checking',
        category: 'New Category',
      },
    ];

    (CSVService.readCSVFile as any).mockResolvedValue('csv content');
    (CSVService.parseCSVContent as any).mockReturnValue(mockRows);
    (CSVService.parseDate as any).mockReturnValue(new Date('2024-01-15'));
    (CSVService.parseAmount as any).mockReturnValue(-50);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const categoryCreation = operations.find((op: any) => op.type === 'create' && op.collection === 'categories');
      expect(categoryCreation).toBeDefined();
    });
  });

  it('skips rows with invalid dates', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockRows = [
      {
        date: 'invalid-date',
        description: 'Test',
        amount: '-50.00',
        account: 'Checking',
        category: 'Groceries',
      },
      {
        date: '2024-01-15',
        description: 'Valid',
        amount: '-30.00',
        account: 'Checking',
        category: 'Groceries',
      },
    ];

    (CSVService.readCSVFile as any).mockResolvedValue('csv content');
    (CSVService.parseCSVContent as any).mockReturnValue(mockRows);
    (CSVService.parseDate as any).mockReturnValueOnce(null).mockReturnValueOnce(new Date('2024-01-15'));
    (CSVService.parseAmount as any).mockReturnValue(-30);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(result.current.importStatus).toBe('error');
      expect(result.current.importError).toContain('1 rows skipped');
    });
  });

  it('handles empty CSV files', async () => {
    const mockFile = new File([''], 'test.csv');

    (CSVService.readCSVFile as any).mockResolvedValue('');
    (CSVService.parseCSVContent as any).mockReturnValue([]);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(result.current.importStatus).toBe('error');
      expect(result.current.importError).toBe('No valid data found in CSV file');
    });
  });

  it('updates import progress during processing', async () => {
    const mockFile = new File([''], 'test.csv');
    const mockRows = Array(150).fill({
      date: '2024-01-15',
      description: 'Test',
      amount: '-50.00',
      account: 'Checking',
      category: 'Groceries',
    });

    (CSVService.readCSVFile as any).mockResolvedValue('csv content');
    (CSVService.parseCSVContent as any).mockReturnValue(mockRows);
    (CSVService.parseDate as any).mockReturnValue(new Date('2024-01-15'));
    (CSVService.parseAmount as any).mockReturnValue(-50);

    const { result } = renderHook(() => useCSVImport('user1', mockAccounts, mockCategories));

    await result.current.importFromCSV(mockFile);

    await waitFor(() => {
      expect(result.current.importProgress).toBeGreaterThan(0);
    });
  });
});
