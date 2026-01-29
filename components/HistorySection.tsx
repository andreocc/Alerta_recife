
import React from 'react';
import { History, Calendar, Clock, MapPin, CloudRain, Waves, Info } from 'lucide-react';
import { FloodHistory } from '../types';

interface HistorySectionProps {
  history: FloodHistory[];
}

export const HistorySection: React.FC<HistorySectionProps> = ({ history }) => {
  const getCauseIcon = (cause: string) => {
    switch (cause) {
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'tide': return <Waves className="w-4 h-4 text-cyan-500" />;
      case 'both': return (
        <div className="flex -space-x-1">
          <CloudRain className="w-4 h-4 text-blue-500" />
          <Waves className="w-4 h-4 text-cyan-500" />
        </div>
      );
      default: return null;
    }
  };

  const getCauseLabel = (cause: string) => {
    switch (cause) {
      case 'rain': return 'Chuva';
      case 'tide': return 'Maré Alta';
      case 'both': return 'Chuva + Maré';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <History className="text-blue-600" />
          Histórico Recente de Alagamentos
        </h3>
        <span className="text-xs font-semibold text-slate-400 uppercase">Últimos 4 eventos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((event) => (
          <div key={event.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{event.date}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{event.time}</span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                event.severity === 'severe' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {event.severity === 'severe' ? 'Grave' : 'Moderado'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {event.areas.map((area, i) => (
                    <span key={i} className="text-sm text-slate-700 font-medium">
                      {area}{i < event.areas.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Causa:</span>
                <div className="flex items-center gap-1.5">
                  {getCauseIcon(event.cause)}
                  <span className="text-xs font-semibold text-slate-600">{getCauseLabel(event.cause)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
