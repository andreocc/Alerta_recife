import React, { useState } from 'react';
import { History, Calendar, Clock, MapPin, CloudRain, Waves, ChevronDown, Share2 } from 'lucide-react';
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
        title: 'Alerta Recife: Histórico',
        text: `Alagamento registrado em ${event.areas.join(', ')} no dia ${event.date}.`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          <History size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white">Histórico</h3>
      </div>

      {/* Chips de filtro */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'rain', label: '🌧️ Chuva' },
          { key: 'tide', label: '🌊 Maré' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'rain' | 'tide')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
              filter === f.key
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'glass text-slate-600 dark:text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de eventos */}
      <div className="space-y-3">
        {filteredHistory.map((event) => {
          const isExpanded = expandedId === event.id;
          return (
            <div
              key={event.id}
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
              className="glass rounded-2xl shadow-3d border border-white/20 dark:border-slate-800/30 overflow-hidden transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Ícone da causa */}
                  <div className={`p-2.5 rounded-xl ${
                    event.severity === 'severe'
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20'
                      : event.cause === 'tide'
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20'
                  }`}>
                    {event.cause === 'tide' ? <Waves size={18} /> : event.cause === 'both' ? <CloudRain size={18} /> : <CloudRain size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      {event.areas[0]}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {event.date}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {event.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleShare(e, event)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Share2 size={16} className="text-slate-400" />
                  </button>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Detalhes expandidos */}
              <div
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4 space-y-3">
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/30">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {event.details || `Áreas afetadas: ${event.areas.join(', ')}. Severidade: ${event.severity}.`}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                        <MapPin size={12} className="text-red-400" />
                        {event.lat.toFixed(3)}, {event.lng.toFixed(3)}
                      </div>
                      {event.areas.length > 1 && (
                        <div className="flex flex-wrap gap-1">
                          {event.areas.slice(1).map(a => (
                            <span key={a} className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
