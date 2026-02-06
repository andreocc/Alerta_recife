
import React from 'react';
import { TimelineEvent } from '../types';

interface TimelineOverlayProps {
  events: TimelineEvent[];
}

export const TimelineOverlay: React.FC<TimelineOverlayProps> = ({ events }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Janelas de Risco de Hoje</h3>
        <div className="flex gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Chuva</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-400 rounded-full"></div> Maré</div>
        </div>
      </div>
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
        {events.map((ev, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="h-32 w-8 bg-slate-50 rounded-full relative overflow-hidden flex flex-col justify-end">
              <div 
                className={`w-full transition-all duration-1000 ${
                  ev.riskType === 'combined' ? 'bg-red-500' : ev.riskType === 'tide' ? 'bg-cyan-400' : 'bg-blue-500'
                }`}
                style={{ height: `${ev.intensity}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{ev.hour}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-2 italic text-center">*Barras representam probabilidade combinada de alagamento por hora.</p>
    </div>
  );
};
