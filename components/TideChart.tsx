
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TideData } from '../types';

interface TideChartProps {
  data: TideData[];
}

export const TideChart: React.FC<TideChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Tábua de Marés (Próximas 24h)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            domain={[0, 3]}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${value}m`, 'Altura']}
          />
          <ReferenceLine y={2.1} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Risco', fill: '#ef4444', fontSize: 10 }} />
          <Area 
            type="monotone" 
            dataKey="height" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTide)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
