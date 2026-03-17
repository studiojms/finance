import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Transaction, Category, Account } from '../types';
import { formatCurrency, cn } from '../utils';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, category, account, onToggle, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 active:bg-slate-50 transition-colors group" onClick={onEdit}>
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
          transaction.isConsolidated ? "bg-emerald-100 text-emerald-600" : "border-2 border-slate-200 text-transparent"
        )}
      >
        <CheckCircle2 size={16} />
      </button>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h4 className="font-bold text-slate-800 leading-tight">{transaction.description}</h4>
            {account && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: account.color }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{account.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn(
              "font-bold",
              transaction.type === 'income' ? "text-emerald-600" : 
              transaction.type === 'expense' ? "text-rose-600" : 
              "text-violet-600"
            )}>
              {transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {format(parseISO(transaction.date), 'dd MMM', { locale: ptBR })}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {transaction.type === 'transfer' ? 'Transferência' : (category?.name || 'Sem categoria')}
          </span>
          {transaction.installmentId && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                {transaction.installmentNumber}/{transaction.totalInstallments}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
