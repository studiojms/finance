import { Category } from './types';

export const DEFAULT_CATEGORIES: Partial<Category>[] = [
  { name: 'Alimentação', icon: 'Utensils', color: '#94a3b8', type: 'expense' },
  { name: 'Carro', icon: 'Car', color: '#fca5a5', type: 'expense' },
  { name: 'Casa', icon: 'Home', color: '#8b5cf6', type: 'expense' },
  { name: 'Educação', icon: 'GraduationCap', color: '#10b981', type: 'expense' },
  { name: 'Lazer', icon: 'Gamepad2', color: '#f59e0b', type: 'expense' },
  { name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { name: 'Trabalho', icon: 'Briefcase', color: '#3b82f6', type: 'income' },
  { name: 'Investimento', icon: 'TrendingUp', color: '#06b6d4', type: 'both' },
];
