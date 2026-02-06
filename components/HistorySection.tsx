
import React, { useState } from 'react';
import { History, Calendar, Clock, MapPin, CloudRain, Waves, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { FloodHistory } from '../types';

interface HistorySectionProps {
  history: FloodHistory[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rain' | 'tide'>('all');

  const filteredHistory = history.filter(h => {
    if (filter === 'all') return true;
    return h.cause === filter || h.cause === 'both';
  });

  const handleShare = async (e: React.MouseEvent, event: FloodHistory) => {
    e.stopPropagation();
    if (navigator.share) {
      await navigator.share({
        title: `Alerta Recife: Histórico`,
        text: `Alagamento registrado em ${event.areas.join(', ')} no dia ${event.date}.`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <History className="text-blue-600" /> Histórico
        </h3>
      </div>

      {/* Chips de Filtro (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => setFilter('all')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>Todos</button>
        <button onClick={() => setFilter('rain')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'rain' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>Chuva</button>
        <button onClick={() => setFilter('tide')} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filter === 'tide' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>Maré</button>
      </div>

      <div className="space-y-3">
        {filteredHistory.map((event) => {
          const isExpanded = expandedId === event.id;
          return (
            <div 
              key={event.id} 
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all active:scale-[0.98]"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${event.severity === 'severe' ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600'}`}>
                      {event.cause === 'tide' ? <Waves size={18} /> : <CloudRain size={18} />}
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{event.areas[0]}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{event.date} • {event.time}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={(e) => handleShare(e, event)} className="p-2 text-slate-300"><Share2 size={16} /></button>
                   {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {event.details || `Áreas afetadas: ${event.areas.join(', ')}. Severidade reportada como ${event.severity}.`}
                    </p>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                          <MapPin size={12} /> {event.lat.toFixed(3)}, {event.lng.toFixed(3)}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
