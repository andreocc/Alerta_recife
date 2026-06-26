import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Waves } from 'lucide-react';
import { TideData } from '../types';

interface TideChartProps {
  data: TideData[];
  loading?: boolean;
}

export const TideChart: React.FC<TideChartProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 shadow-3d border border-white/20 dark:border-slate-800/30">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4 animate-pulse" />
        <div className="h-44 w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-5 shadow-3d border border-white/20 dark:border-slate-800/30">
      {/* Título */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
          <Waves size={14} strokeWidth={2.5} />
        </div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          Tábua de Marés <span className="text-slate-300">24h</span>
        </h3>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <filter id="tideGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                fontWeight: 800,
                fontSize: '12px',
                padding: '8px 12px',
              }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <ReferenceLine
              y={2.1}
              stroke="url(#dangerGradient)"
              strokeDasharray="6 4"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="dangerGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="height"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#tideGradient)"
              animationDuration={1200}
              filter="url(#tideGlow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
