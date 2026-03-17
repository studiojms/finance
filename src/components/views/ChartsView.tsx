import React from 'react';
import { motion } from 'motion/react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { FilterSection } from '../FilterSection';
import { formatCurrency } from '../../utils';
import { Account, Transaction, Category } from '../../types';

interface ChartsViewProps {
  filteredTransactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  selectedAccountId: string | 'all';
  setSelectedAccountId: (id: string | 'all') => void;
  selectedCategoryId: string | 'all';
  setSelectedCategoryId: (id: string | 'all') => void;
  filterToday: boolean;
  setFilterToday: (val: boolean) => void;
  getPieData: (transactions: Transaction[], categories: Category[]) => any[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({
  filteredTransactions,
  categories,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  selectedCategoryId,
  setSelectedCategoryId,
  filterToday,
  setFilterToday,
  getPieData,
}) => {
  const pieData = getPieData(filteredTransactions, categories);

  return (
    <motion.div 
      key="charts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <FilterSection 
        title="Análise Mensal" 
        filterToday={filterToday}
        setFilterToday={setFilterToday}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        accounts={accounts}
        categories={categories}
      />
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Despesas por Categoria</h3>
        
        {pieData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <PieChartIcon className="mx-auto mb-2 opacity-20" size={48} />
            <p className="text-sm">Nenhum dado para os filtros selecionados.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
