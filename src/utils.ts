import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Transaction, Category } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPieData(transactions: Transaction[], categories: Category[]) {
  const data: Record<string, { value: number; color: string }> = {};

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      const name = cat?.name || 'Outros';
      if (!data[name]) {
        data[name] = { value: 0, color: cat?.color || '#cbd5e1' };
      }
      data[name].value += t.amount;
    });

  return Object.entries(data).map(([name, info]) => ({ name, ...info }));
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};
