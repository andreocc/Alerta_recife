import React from 'react';
import { Clock } from 'lucide-react';
import { TimelineEvent } from '../types';

interface TimelineOverlayProps {
  events: TimelineEvent[];
  loading?: boolean;
}

export const TimelineOverlay: React.FC<TimelineOverlayProps> = ({ events, loading = false }) => {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 shadow-3d border border-white/20 dark:border-slate-800/30">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="h-24 md:h-28 w-9 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              <div className="h-2 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 shadow-3d border border-white/20 dark:border-slate-800/30">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
            <Clock size={14} strokeWidth={2.5} />
          </div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Previsão <span className="text-slate-300">24h</span>
          </h3>
        </div>
        <div className="flex gap-3 text-[8px] font-black uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-sm shadow-blue-400/50" />
            Chuva
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gradient-to-b from-cyan-400 to-teal-500 shadow-sm shadow-cyan-400/50" />
            Maré
          </div>
        </div>
      </div>

      {/* Barras com gradiente */}
      <div className="flex overflow-x-auto pb-3 gap-2 no-scrollbar snap-x snap-mandatory">
        {events.map((ev, i) => {
          const isCombined = ev.riskType === 'combined';
          const barColor = isCombined
            ? 'bg-gradient-to-t from-red-500/80 via-red-400 to-red-300'
            : ev.riskType === 'tide'
              ? 'bg-gradient-to-t from-cyan-500/80 via-cyan-400 to-cyan-300'
              : 'bg-gradient-to-t from-blue-500/80 via-blue-400 to-blue-300';

          return (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 snap-center">
              <div className="h-24 md:h-28 w-9 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl relative overflow-hidden backdrop-blur">
                {/* Brilho no topo */}
                <div className={`absolute top-0 inset-x-0 h-1 rounded-full ${isCombined ? 'bg-red-300' : ev.riskType === 'tide' ? 'bg-cyan-300' : 'bg-blue-300'} opacity-80`} />
                <div
                  className={`absolute bottom-0 inset-x-0 rounded-b-2xl transition-all duration-1000 ease-out ${barColor}`}
                  style={{ height: `${ev.intensity}%` }}
                >
                  {/* Highlight no topo da barra */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 tracking-tighter">
                {ev.hour}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-2 text-center uppercase">
        Arraste para ver o dia todo
      </p>
    </div>
  );
};
