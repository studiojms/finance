import React from 'react';
import { cn } from '../utils';
import { Account, Category } from '../types';

interface FilterSectionProps {
  title: string;
  filterToday: boolean;
  setFilterToday: (value: boolean) => void;
  selectedAccountId: string | 'all';
  setSelectedAccountId: (value: string | 'all') => void;
  selectedCategoryId: string | 'all';
  setSelectedCategoryId: (value: string | 'all') => void;
  accounts: Account[];
  categories: Category[];
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  filterToday,
  setFilterToday,
  selectedAccountId,
  setSelectedAccountId,
  selectedCategoryId,
  setSelectedCategoryId,
  accounts,
  categories,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl landscape:text-base font-bold text-slate-800">{title}</h2>
        <button
          onClick={() => setFilterToday(!filterToday)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
            filterToday
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200'
          )}
        >
          Hoje
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="p-2 pr-8 bg-white rounded-xl shadow-sm border border-slate-200 text-xs font-bold min-w-[120px] appearance-none"
          >
            <option value="all">Todas Contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {selectedAccountId !== 'all' && accounts.find((a) => a.id === selectedAccountId) && (
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: accounts.find((a) => a.id === selectedAccountId)?.color }}
            />
          )}
        </div>

        <div className="relative">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="p-2 pr-8 bg-white rounded-xl shadow-sm border border-slate-200 text-xs font-bold min-w-[120px] appearance-none"
          >
            <option value="all">Todas Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedCategoryId !== 'all' && categories.find((c) => c.id === selectedCategoryId) && (
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: categories.find((c) => c.id === selectedCategoryId)?.color }}
            />
          )}
        </div>

        {(selectedAccountId !== 'all' || selectedCategoryId !== 'all' || filterToday) && (
          <button
            onClick={() => {
              setSelectedAccountId('all');
              setSelectedCategoryId('all');
              setFilterToday(false);
            }}
            className="p-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
};
