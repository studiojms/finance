import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils';
import { Account, Category } from '../types';
import { ChevronDown, Check } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  filterToday: boolean;
  setFilterToday: (value: boolean) => void;
  selectedAccountIds: string[];
  setSelectedAccountIds: (value: string[]) => void;
  selectedCategoryIds: string[];
  setSelectedCategoryIds: (value: string[]) => void;
  accounts: Account[];
  categories: Category[];
}

interface MultiSelectDropdownProps {
  label: string;
  items: { id: string; name: string; color?: string }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  items,
  selectedIds,
  onSelectionChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(items.map((item) => item.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const displayText =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === items.length
        ? placeholder
        : `${selectedIds.length} selecionado${selectedIds.length > 1 ? 's' : ''}`;

  const selectedColors = selectedIds.map((id) => items.find((item) => item.id === id)?.color).filter(Boolean);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 pr-8 bg-white rounded-xl shadow-sm border border-slate-200 text-xs font-bold min-w-[120px] flex items-center gap-2 relative"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={cn('absolute right-2 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {selectedColors.length > 0 && selectedColors.length < items.length && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 pointer-events-none">
          {selectedColors.slice(0, 3).map((color, idx) => (
            <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 min-w-[200px] max-h-[300px] overflow-y-auto"
          style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 p-2 flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded"
            >
              Limpar
            </button>
          </div>
          <div className="p-1">
            {items.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-slate-500">Nenhum item disponível</div>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded text-left"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                      )}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {item.color && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    )}
                    <span className="text-xs font-medium text-slate-700 truncate">{item.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  filterToday,
  setFilterToday,
  selectedAccountIds,
  setSelectedAccountIds,
  selectedCategoryIds,
  setSelectedCategoryIds,
  accounts,
  categories,
}) => {
  const hasFilters = selectedAccountIds.length > 0 || selectedCategoryIds.length > 0 || filterToday;

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

      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <MultiSelectDropdown
            label="Contas"
            items={accounts}
            selectedIds={selectedAccountIds}
            onSelectionChange={setSelectedAccountIds}
            placeholder="Todas Contas"
          />

          <MultiSelectDropdown
            label="Categorias"
            items={categories}
            selectedIds={selectedCategoryIds}
            onSelectionChange={setSelectedCategoryIds}
            placeholder="Todas Categorias"
          />

          {hasFilters && (
            <button
              onClick={() => {
                setSelectedAccountIds([]);
                setSelectedCategoryIds([]);
                setFilterToday(false);
              }}
              className="p-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold whitespace-nowrap"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
