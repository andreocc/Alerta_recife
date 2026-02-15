
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TideData } from '../types';

interface TideChartProps {
  data: TideData[];
}

export const TideChart: React.FC<TideChartProps> = ({ data }) => {
  // Se não houver dados, não renderiza o container para evitar erros de cálculo de dimensão
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
      <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Tábua de Marés (Próximas 24h)</h3>
      <div className="h-48 w-full" style={{ minHeight: '192px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <ReferenceLine y={2.1} stroke="#ef4444" strokeDasharray="5 5" />
            <Area 
              type="monotone" 
              dataKey="height" 
              stroke="#3b82f6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorTide)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
