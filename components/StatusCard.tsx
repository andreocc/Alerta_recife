
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
      <div className="animate-pulse bg-white rounded-3xl p-8 border border-slate-200 h-64 flex flex-col justify-center items-center">
        <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 w-48 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 w-32 bg-slate-100 rounded"></div>
      </div>
    );
  }

  const configs = {
    low: {
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-500" />,
      label: 'Normal'
    },
    medium: {
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
      label: 'Atenção'
    },
    high: {
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: <AlertCircle className="w-10 h-10 text-orange-500" />,
      label: 'Alerta'
    },
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: <ShieldAlert className="w-10 h-10 text-red-500" />,
      label: 'CRÍTICO'
    }
  };

  // Safe access with fallback to 'low' config if the level is unknown or malformed
  const levelKey = (analysis.level?.toLowerCase() as keyof typeof configs) || 'low';
  const config = configs[levelKey] || configs.low;

  return (
    <div className={`rounded-3xl p-6 md:p-8 border-2 ${config.borderColor} ${config.bgColor} transition-all duration-500`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            {config.icon}
          </div>
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${config.textColor}`}>Status Atual</span>
            <h2 className={`text-3xl font-black ${config.textColor}`}>{config.label}</h2>
          </div>
        </div>
        <div className="hidden md:flex gap-2">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Inteligência Artificial</span>
              <span className="text-xs font-medium text-slate-600">Gemini 3.0 Ativo</span>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">{analysis.title}</h3>
          <p className="text-slate-600 leading-relaxed">{analysis.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-white/50">
              <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
              <span className="text-sm font-medium text-slate-700">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
