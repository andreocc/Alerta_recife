
import React from 'react';
import { CloudRain, Waves, Mountain, MapPin, AlertCircle, Info, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { RiskAnalysis, RiskLevel } from '../types';

interface StatusCardProps {
  analysis: RiskAnalysis | null;
  loading: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({ analysis, loading }) => {
  if (loading || !analysis) {
    return (
      <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-96 flex flex-col justify-center items-center">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  const getLevelConfig = (level: RiskLevel) => {
    switch(level) {
      case 'extremo': return { color: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-600/30', lightBg: 'bg-purple-50', label: 'AJA AGORA', icon: ShieldAlert };
      case 'crítico': return { color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500/30', lightBg: 'bg-red-50', label: 'PERIGO REAL', icon: ShieldAlert };
      case 'alto': return { color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500/30', lightBg: 'bg-orange-50', label: 'PREPARE-SE', icon: AlertCircle };
      case 'médio': return { color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500/30', lightBg: 'bg-amber-50', label: 'FIQUE ATENTO', icon: AlertTriangle };
      case 'baixo': return { color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/30', lightBg: 'bg-emerald-50', label: 'NORMALIDADE', icon: CheckCircle };
      default: return { color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500/30', lightBg: 'bg-emerald-50', label: 'NORMALIDADE', icon: CheckCircle };
    }
  };

  const mainConfig = getLevelConfig(analysis.level);

  return (
    <div className="space-y-4">
      {/* Bloco Operacional de Resposta Rápida */}
      <div className={`rounded-3xl p-6 md:p-8 border-2 ${mainConfig.border} bg-white dark:bg-slate-900 shadow-xl overflow-hidden relative`}>
        {/* Indicador Lateral de Cor */}
        <div className={`absolute top-0 left-0 w-2 h-full ${mainConfig.bg}`} />
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${mainConfig.bg}`}>
              {mainConfig.label}: {analysis.level}
            </span>
            <div className="flex gap-2">
               {[
                 { icon: CloudRain, val: analysis.breakdown.meteorological },
                 { icon: Waves, val: analysis.breakdown.hydrological },
                 { icon: Mountain, val: analysis.breakdown.geotechnical }
               ].map((p, i) => (
                 <div key={i} className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${getLevelConfig(p.val).color}`}>
                   <p.icon size={16} />
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Info size={12} className="text-blue-500" /> O que está acontecendo?
              </h3>
              <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                {analysis.summary.what}
              </p>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <MapPin size={12} className="text-red-500" /> Onde exatamente?
              </h3>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {analysis.summary.where}
              </p>
            </section>

            <section className={`p-5 rounded-2xl ${mainConfig.lightBg} dark:bg-slate-800/40 border ${mainConfig.border}`}>
              <h3 className={`text-[10px] font-black ${mainConfig.color} uppercase tracking-widest flex items-center gap-1.5 mb-3`}>
                <Zap size={12} /> O que eu devo fazer agora?
              </h3>
              <ul className="space-y-3">
                {analysis.summary.actions.map((action, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className={`mt-1 h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black text-white ${mainConfig.bg}`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {action}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Rodapé Técnico para Gestores/Curiosos */}
        {analysis.technicalDetails && (
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            <details className="cursor-pointer group">
              <summary className="text-[9px] font-black text-slate-400 uppercase tracking-widest list-none flex items-center justify-between">
                Ver dados técnicos e jargões
                <span className="group-open:rotate-180 transition-transform text-slate-300">▼</span>
              </summary>
              <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                {analysis.technicalDetails}
              </p>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

// Re-importing missing component from previous context
const AlertTriangle = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
