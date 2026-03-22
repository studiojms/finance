import React from 'react';
import { motion } from 'motion/react';
import { Download, Upload } from 'lucide-react';
import { cn } from '../../utils';

interface DataViewProps {
  isImporting: boolean;
  importProgress: number;
  importStatus: 'idle' | 'processing' | 'success' | 'error';
  importError: string;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const DataView: React.FC<DataViewProps> = ({
  isImporting,
  importProgress,
  importStatus,
  importError,
  onExport,
  onImport,
}) => {
  return (
    <motion.div
      key="data"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold text-slate-800">Importar e Exportar</h2>

      <div className="grid gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Exportar Dados</h3>
              <p className="text-xs text-slate-400 text-balance">Baixe todos os seus lançamentos em formato CSV.</p>
            </div>
          </div>
          <button
            onClick={onExport}
            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            Exportar CSV
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Importar Dados</h3>
              <p className="text-xs text-slate-400 text-balance">Envie um arquivo CSV com seus lançamentos.</p>
            </div>
          </div>
          <label
            className={cn(
              'block w-full py-4 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-center cursor-pointer',
              isImporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-violet-600 shadow-violet-100'
            )}
          >
            {isImporting ? 'Importando...' : 'Importar CSV'}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              disabled={isImporting}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
              }}
            />
          </label>

          {importStatus !== 'idle' && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span
                  className={cn(
                    importStatus === 'processing'
                      ? 'text-violet-600'
                      : importStatus === 'success'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                  )}
                >
                  {importStatus === 'processing'
                    ? `Processando... ${importProgress}%`
                    : importStatus === 'success'
                      ? 'Importação concluída!'
                      : 'Erro na importação'}
                </span>
                {importStatus === 'processing' && <span className="text-slate-400">{importProgress}%</span>}
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${importProgress}%` }}
                  className={cn(
                    'h-full transition-all duration-500',
                    importStatus === 'processing'
                      ? 'bg-violet-500'
                      : importStatus === 'success'
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                  )}
                />
              </div>
              {importStatus === 'error' && (
                <p className="text-[10px] text-rose-500 font-medium leading-tight">{importError}</p>
              )}
            </div>
          )}

          <div className="mt-4 p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Formato esperado:</p>
            <p className="text-[10px] text-slate-500 font-mono">Data Ocorrência, Descrição, Valor, Categoria, Conta</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
