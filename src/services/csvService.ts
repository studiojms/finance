import { format } from 'date-fns';
import { Transaction, Category, Account } from '../types';
import { parseISO } from 'date-fns';

export interface CSVRow {
  date: string;
  description: string;
  amount: string;
  category: string;
  account: string;
}

export class CSVService {
  static exportToCSV(transactions: Transaction[], categories: Category[], accounts: Account[]): Blob {
    const headers = ['Data Ocorrência', 'Descrição', 'Valor', 'Categoria', 'Conta'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
      const acc = accounts.find((a) => a.id === t.accountId)?.name || '';
      const date = format(parseISO(t.date), 'dd/MM/yyyy');
      const amount = t.type === 'expense' ? -t.amount : t.amount;
      return [date, t.description, amount.toFixed(2), cat, acc];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  static downloadCSV(blob: Blob, filename?: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `financas_pro_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static parseCSVLine(line: string): string[] {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    return values.map((v) => v.replace(/^"|"$/g, '').trim());
  }

  static parseDate(dateStr: string): Date | null {
    const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
    if (parts.length !== 3) return null;

    let dateObj: Date;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
    } else {
      // DD/MM/YYYY
      dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
    }

    return isNaN(dateObj.getTime()) ? null : dateObj;
  }

  static parseAmount(amountStr: string): number | null {
    const amount = parseFloat(amountStr.replace(',', '.'));
    return isNaN(amount) ? null : amount;
  }

  static readCSVFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  static parseCSVContent(content: string): CSVRow[] {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const dataLines = lines.slice(1).filter((l) => l.trim() !== '');
    const rows: CSVRow[] = [];

    for (const line of dataLines) {
      const values = this.parseCSVLine(line);
      if (values.length >= 5) {
        rows.push({
          date: values[0],
          description: values[1],
          amount: values[2],
          category: values[3],
          account: values[4],
        });
      }
    }

    return rows;
  }
}
