
import React from 'react';
import { TimelineEvent } from '../types';

interface TimelineOverlayProps {
  events: TimelineEvent[];
}

export const TimelineOverlay: React.FC<TimelineOverlayProps> = ({ events }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Previsão 24h</h3>
        <div className="flex gap-2 text-[8px] font-black uppercase">
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Chuva</div>
          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div> Maré</div>
        </div>
      </div>
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar snap-x snap-mandatory">
        {events.map((ev, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 snap-center">
            <div className="h-24 md:h-32 w-8 bg-slate-50 dark:bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col justify-end">
              <div 
                className={`w-full transition-all duration-1000 ${
                  ev.riskType === 'combined' ? 'bg-red-500' : ev.riskType === 'tide' ? 'bg-cyan-400' : 'bg-blue-500'
                }`}
                style={{ height: `${ev.intensity}%` }}
              ></div>
            </div>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 tracking-tighter">{ev.hour}</span>
          </div>
        ))}
      </div>
      <p className="text-[8px] font-bold text-slate-300 dark:text-slate-600 mt-2 text-center uppercase">Arraste para o lado para ver o dia todo</p>
    </div>
  );
};
