import React from 'react';
import { CloudRain, Waves, Mountain, MapPin, AlertCircle, Info, CheckCircle, ShieldAlert, Zap, ChevronDown } from 'lucide-react';
import { RiskAnalysis, RiskLevel } from '../types';

// ── AlertTriangle local (precisa estar antes do levelConfigs) ─
const AlertTriangle = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

interface StatusCardProps {
  analysis: RiskAnalysis | null;
  loading: boolean;
}

// ── Config por nível ────────────────────────────────────────
interface LevelConfig {
  gradient: string;
  glow: string;
  badgeBg: string;
  lightBg: string;
  border: string;
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const levelConfigs: Record<RiskLevel, LevelConfig> = {
  extremo: {
    gradient: 'from-purple-600 via-fuchsia-500 to-purple-600',
    glow: 'shadow-[0_0_40px_rgba(147,51,234,0.3)]',
    badgeBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600',
    lightBg: 'bg-purple-50/80 dark:bg-purple-950/30',
    border: 'border-purple-300/50 dark:border-purple-700/30',
    text: 'text-purple-700 dark:text-purple-200',
    icon: ShieldAlert,
    label: 'EMERGÊNCIA',
  },
  crítico: {
    gradient: 'from-red-500 to-orange-500',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]',
    badgeBg: 'bg-gradient-to-r from-red-500 to-orange-500',
    lightBg: 'bg-red-50/80 dark:bg-red-950/30',
    border: 'border-red-300/50 dark:border-red-700/30',
    text: 'text-red-700 dark:text-red-200',
    icon: ShieldAlert,
    label: 'PERIGO REAL',
  },
  alto: {
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.25)]',
    badgeBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    lightBg: 'bg-orange-50/80 dark:bg-orange-950/30',
    border: 'border-orange-300/50 dark:border-orange-700/30',
    text: 'text-orange-700 dark:text-orange-200',
    icon: AlertCircle,
    label: 'ALERTA',
  },
  médio: {
    gradient: 'from-amber-400 to-yellow-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    lightBg: 'bg-amber-50/80 dark:bg-amber-950/30',
    border: 'border-amber-300/50 dark:border-amber-700/30',
    text: 'text-amber-700 dark:text-amber-200',
    icon: AlertTriangle,
    label: 'ATENÇÃO',
  },
  baixo: {
    gradient: 'from-emerald-400 to-teal-500',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    badgeBg: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    lightBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-300/50 dark:border-emerald-700/30',
    text: 'text-emerald-700 dark:text-emerald-200',
    icon: CheckCircle,
    label: 'NORMALIDADE',
  },
};

// ── Ícone de fator (cápsula de vidro) ─────────────────────
const FactorIcon: React.FC<{ icon: React.ComponentType<{ size?: number }>; level: RiskLevel; active: boolean }> = ({ icon: Icon, level, active }) => (
  <div className={`p-2 rounded-xl transition-all duration-300 ${
    active
      ? `bg-gradient-to-br ${levelConfigs[level].gradient} text-white shadow-lg scale-105`
      : 'glass text-slate-400'
  }`}>
    <Icon size={16} />
  </div>
);

// ── Componente principal ────────────────────────────────────
export const StatusCard: React.FC<StatusCardProps> = ({ analysis, loading }) => {
  const [techOpen, setTechOpen] = React.useState(false);

  if (loading || !analysis) {
    return (
      <div className="glass rounded-[2rem] p-6 shadow-3d-lg border border-white/20 dark:border-slate-800/30">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const config = levelConfigs[analysis.level];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* ── Card principal 3D ─────────────────── */}
      <div className={`relative glass rounded-[2rem] p-5 md:p-6 shadow-3d-lg border border-white/20 dark:border-slate-800/30 overflow-hidden transition-shadow duration-500 ${config.glow}`}>
        {/* Aro de luz no topo (indicador de nível) */}
        <div className={`absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r ${config.gradient} opacity-80`} />

        {/* Cabeçalho: badge + fatores */}
        <div className="flex items-center justify-between mb-5 mt-1">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${config.badgeBg}`}>
            {config.label}: {analysis.level}
          </span>
          <div className="flex gap-2">
            <FactorIcon icon={CloudRain} level={analysis.breakdown.meteorological} active={analysis.breakdown.meteorological !== 'baixo'} />
            <FactorIcon icon={Waves} level={analysis.breakdown.hydrological} active={analysis.breakdown.hydrological !== 'baixo'} />
            <FactorIcon icon={Mountain} level={analysis.breakdown.geotechnical} active={analysis.breakdown.geotechnical !== 'baixo'} />
          </div>
        </div>

        {/* ── Corpo ──────────────────────────── */}
        <div className="space-y-5">
          {/* O que está acontecendo? */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Info size={12} className="text-blue-400" /> O que está acontecendo?
            </h3>
            <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-tight">
              {analysis.summary.what}
            </p>
          </section>

          {/* Onde? */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <MapPin size={12} className="text-red-400" /> Onde exatamente?
            </h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {analysis.summary.where}
            </p>
          </section>

          {/* O que fazer? — Steps numerados */}
          <section className={`p-5 rounded-2xl ${config.lightBg} border ${config.border}`}>
            <h3 className={`text-[10px] font-black ${config.text} uppercase tracking-widest flex items-center gap-1.5 mb-4`}>
              <Zap size={12} /> O que eu devo fazer agora?
            </h3>
            <div className="space-y-3">
              {analysis.summary.actions.map((action, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <div className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br ${config.gradient} shadow-md group-hover:scale-110 transition-transform`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Dados técnicos (accordion vidro) ── */}
        {analysis.technicalDetails && (
          <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/30">
            <button
              onClick={() => setTechOpen(!techOpen)}
              className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest"
            >
              <span>Dados técnicos</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${techOpen ? 'rotate-180' : ''}`} />
            </button>
            {techOpen && (
              <p className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl animate-fade-in">
                {analysis.technicalDetails}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
