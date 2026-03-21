import React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types';
import { IconRenderer } from '../IconRenderer';

interface CategoriesViewProps {
  categories: Category[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddCategory: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const incomeCategories = categories.filter((c) => c.type === 'income' || c.type === 'both');

  const renderCategory = (category: Category) => (
    <div
      key={category.id}
      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
          style={{ backgroundColor: category.color }}
        >
          <IconRenderer iconName={category.icon} size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">{category.name}</h4>
          <p className="text-xs text-slate-400 capitalize">
            {category.type === 'expense' ? 'Despesa' : category.type === 'income' ? 'Receita' : 'Ambos'}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onEditCategory(category)}
          className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
        >
          <Edit2 size={18} />
        </button>
        {category.userId && (
          <button
            onClick={() => onDeleteCategory(category)}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      key="categories"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold text-slate-800">Minhas Categorias</h2>

      {expenseCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Despesas</h3>
          <div className="grid gap-3">{expenseCategories.map(renderCategory)}</div>
        </div>
      )}

      {incomeCategories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Receitas</h3>
          <div className="grid gap-3">{incomeCategories.map(renderCategory)}</div>
        </div>
      )}

      <button
        onClick={onAddCategory}
        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-emerald-300 hover:text-emerald-600 transition-colors mb-20"
      >
        <Plus size={20} />
        Adicionar Categoria
      </button>
    </motion.div>
  );
};
