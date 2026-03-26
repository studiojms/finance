import { CSVService } from './csvService';
import { Transaction, Category, Account } from '../types';

// Helper to convert Blob to text in test environment
async function blobToText(blob: Blob): Promise<string> {
  if (blob.text) {
    return blob.text();
  }
  // Fallback for environments where Blob.text() is not available
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('CSVService', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Food',
      icon: 'Utensils',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: 'cat2',
      name: 'Salary',
      icon: 'DollarSign',
      color: '#10b981',
      type: 'income',
      userId: 'user1',
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Checking',
      type: 'checking',
      balance: 1000,
      initialBalance: 0,
      initialBalanceDate: '2024-01-01',
      color: '#3b82f6',
      icon: 'Banknote',
      userId: 'user1',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      description: 'Grocery Shopping',
      amount: 150.5,
      date: '2024-01-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    },
    {
      id: 't2',
      description: 'Monthly Salary',
      amount: 5000,
      date: '2024-01-01T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat2',
      type: 'income',
      isConsolidated: true,
      userId: 'user1',
    },
  ];

  describe('exportToCSV', () => {
    it('creates a CSV blob with correct headers', () => {
      const blob = CSVService.exportToCSV(mockTransactions, mockCategories, mockAccounts);

      expect(blob.type).toBe('text/csv;charset=utf-8;');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('includes all transactions in CSV', async () => {
      const blob = CSVService.exportToCSV(mockTransactions, mockCategories, mockAccounts);
      const text = await blobToText(blob);
      const lines = text.split('\n');
      expect(lines.length).toBe(3); // header + 2 transactions
    });

    it('formats expense amounts as negative', async () => {
      const blob = CSVService.exportToCSV(mockTransactions, mockCategories, mockAccounts);
      const text = await blobToText(blob);
      expect(text).toContain('-150.50');
    });

    it('formats income amounts as positive', async () => {
      const blob = CSVService.exportToCSV(mockTransactions, mockCategories, mockAccounts);
      const text = await blobToText(blob);
      expect(text).toContain('5000.00');
    });
  });

  describe('parseCSVLine', () => {
    it('splits simple CSV line correctly', () => {
      const line = '15/01/2024,Grocery,150.50,Food,Checking';
      const result = CSVService.parseCSVLine(line);

      expect(result).toEqual(['15/01/2024', 'Grocery', '150.50', 'Food', 'Checking']);
    });

    it('handles quoted values with commas', () => {
      const line = '15/01/2024,"Description, with comma",150.50,Food,Checking';
      const result = CSVService.parseCSVLine(line);

      expect(result[1]).toBe('Description, with comma');
    });

    it('removes surrounding quotes', () => {
      const line = '"15/01/2024","Grocery","150.50","Food","Checking"';
      const result = CSVService.parseCSVLine(line);

      expect(result).toEqual(['15/01/2024', 'Grocery', '150.50', 'Food', 'Checking']);
    });
  });

  describe('parseDate', () => {
    it('parses DD/MM/YYYY format', () => {
      const result = CSVService.parseDate('15/01/2024');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getDate()).toBe(15);
    });

    it('parses YYYY-MM-DD format', () => {
      const result = CSVService.parseDate('2024-01-15');

      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2024);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('returns null for invalid date', () => {
      const result = CSVService.parseDate('invalid-date');

      expect(result).toBeNull();
    });

    it('returns null for incomplete date', () => {
      const result = CSVService.parseDate('15/01');

      expect(result).toBeNull();
    });
  });

  describe('parseAmount', () => {
    it('parses positive number', () => {
      const result = CSVService.parseAmount('150.50');

      expect(result).toBe(150.5);
    });

    it('parses negative number', () => {
      const result = CSVService.parseAmount('-150.50');

      expect(result).toBe(-150.5);
    });

    it('handles comma as decimal separator', () => {
      const result = CSVService.parseAmount('150,50');

      expect(result).toBe(150.5);
    });

    it('returns null for invalid number', () => {
      const result = CSVService.parseAmount('not-a-number');

      expect(result).toBeNull();
    });
  });

  describe('parseCSVContent', () => {
    it('parses valid CSV content', () => {
      const content = `Data Ocorrência,Descrição,Valor,Categoria,Conta
15/01/2024,Grocery,150.50,Food,Checking
01/01/2024,Salary,5000.00,Salary,Checking`;

      const result = CSVService.parseCSVContent(content);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '15/01/2024',
        description: 'Grocery',
        amount: '150.50',
        category: 'Food',
        account: 'Checking',
      });
    });

    it('skips empty lines', () => {
      const content = `Data Ocorrência,Descrição,Valor,Categoria,Conta
15/01/2024,Grocery,150.50,Food,Checking

01/01/2024,Salary,5000.00,Salary,Checking`;

      const result = CSVService.parseCSVContent(content);

      expect(result).toHaveLength(2);
    });

    it('skips invalid rows with missing fields', () => {
      const content = `Data Ocorrência,Descrição,Valor,Categoria,Conta
15/01/2024,Grocery,150.50
01/01/2024,Salary,5000.00,Salary,Checking`;

      const result = CSVService.parseCSVContent(content);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Salary');
    });

    it('returns empty array for empty content', () => {
      const result = CSVService.parseCSVContent('');

      expect(result).toEqual([]);
    });

    it('returns empty array for only headers', () => {
      const content = 'Data Ocorrência,Descrição,Valor,Categoria,Conta';

      const result = CSVService.parseCSVContent(content);

      expect(result).toEqual([]);
    });
  });
});
