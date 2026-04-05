import { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Tag,
  Utensils,
  Car,
  Home,
  GraduationCap,
  Gamepad2,
  HeartPulse,
  Briefcase,
  TrendingUp,
  ShoppingBag,
  Shirt,
  Plane,
  Coffee,
  Smartphone,
  DollarSign,
} from 'lucide-react';
import { Category } from '../../types';
import { handleFirestoreError } from '../../services/errorService';
import { DatabaseService } from '../../services/databaseService';
import { cn } from '../../utils';

const CATEGORY_ICONS = [
  { id: 'Tag', icon: Tag },
  { id: 'Utensils', icon: Utensils },
  { id: 'Car', icon: Car },
  { id: 'Home', icon: Home },
  { id: 'GraduationCap', icon: GraduationCap },
  { id: 'Gamepad2', icon: Gamepad2 },
  { id: 'HeartPulse', icon: HeartPulse },
  { id: 'Briefcase', icon: Briefcase },
  { id: 'TrendingUp', icon: TrendingUp },
  { id: 'ShoppingBag', icon: ShoppingBag },
  { id: 'Shirt', icon: Shirt },
  { id: 'Plane', icon: Plane },
  { id: 'Coffee', icon: Coffee },
  { id: 'Smartphone', icon: Smartphone },
  { id: 'DollarSign', icon: DollarSign },
];

const CATEGORY_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#6366f1',
  '#a855f7',
  '#94a3b8',
  '#64748b',
  '#475569',
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editingCategory: Category | null;
}

export function CategoryModal({ isOpen, onClose, userId, editingCategory }: CategoryModalProps) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState<Category['type']>(editingCategory?.type || 'expense');
  const [color, setColor] = useState(editingCategory?.color || '#94a3b8');
  const [icon, setIcon] = useState(editingCategory?.icon || 'Tag');

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      const data = {
        name: name.trim(),
        type,
        color,
        icon,
        userId,
      };

      if (editingCategory) {
        await DatabaseService.updateDocument('categories', editingCategory.id, data);
      } else {
        await DatabaseService.addDocument('categories', data);
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, editingCategory ? 'update' : 'create', 'categories');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-[3rem] p-8 space-y-6 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex-1 text-center">
            {editingCategory ? 'Editar' : 'Nova'} Categoria
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome</label>
            <input
              type="text"
              placeholder="Nome da Categoria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500 border-none outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
              Tipo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('expense')}
                className={cn(
                  'flex-1 py-3 rounded-2xl font-bold text-sm transition-all',
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                Despesa
              </button>
              <button
                onClick={() => setType('income')}
                className={cn(
                  'flex-1 py-3 rounded-2xl font-bold text-sm transition-all',
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                Receita
              </button>
              <button
                onClick={() => setType('both')}
                className={cn(
                  'flex-1 py-3 rounded-2xl font-bold text-sm transition-all',
                  type === 'both'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                Ambos
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
              Ícone
            </label>
            <div className="grid grid-cols-5 gap-3">
              {CATEGORY_ICONS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setIcon(id)}
                  className={cn(
                    'w-full aspect-square rounded-2xl flex items-center justify-center transition-all',
                    icon === id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <Icon size={24} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">
              Cor
            </label>
            <div className="grid grid-cols-5 gap-3">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-full aspect-square rounded-2xl transition-all',
                    color === c ? 'ring-4 ring-slate-300 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-5 rounded-[2rem] bg-emerald-600 text-white font-black text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
        </button>
      </motion.div>
    </motion.div>
  );
}
