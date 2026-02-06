
import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RiskAnalysis } from '../types';

interface StatusCardProps {
  analysis: RiskAnalysis | null;
  loading: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ analysis, loading }) => {
  if (loading || !analysis) {
    return (
      <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-48 md:h-64 flex flex-col justify-center items-center">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const configs = {
    low: {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      icon: <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />,
      label: 'Normal'
    },
    medium: {
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-900',
      icon: <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />,
      label: 'Atenção'
    },
    high: {
      color: 'bg-orange-500',
      textColor: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-900',
      icon: <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />,
      label: 'Alerta'
    },
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-900',
      icon: <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-red-500" />,
      label: 'CRÍTICO'
    }
  };

  const levelKey = (analysis.level?.toLowerCase() as keyof typeof configs) || 'low';
  const config = configs[levelKey] || configs.low;

  return (
    <div className={`rounded-3xl p-6 md:p-8 border-2 ${config.borderColor} ${config.bgColor} shadow-sm transition-all duration-500`}>
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
            {config.icon}
          </div>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${config.textColor}`}>Risco em Recife</span>
            <h2 className={`text-2xl md:text-3xl font-black ${config.textColor} leading-none`}>{config.label}</h2>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-base md:text-xl font-black text-slate-800 dark:text-white mb-1 leading-tight">{analysis.title}</h3>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{analysis.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/40 dark:bg-slate-800/40 p-3 rounded-xl border border-white/40 dark:border-slate-800/40">
              <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${config.color}`}></div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
