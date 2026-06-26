/**
 * AlertBanner — Banner de alerta moderno com efeito glow 3D.
 *
 * Níveis crítico/extremo ganham animação de pulso no glow.
 * Entrada com slide + spring. Botões em vidro.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  X,
  Bell,
  BellOff,
} from 'lucide-react';
import type { RiskLevel } from '../types';
import {
  requestNotificationPermission,
  dismissAlert,
  isAlertDismissed,
  generateAlertId,
  hasRiskChanged,
  sendAlertNotification,
} from '../services/notificationService';

interface AlertBannerProps {
  level: RiskLevel;
  title: string;
  message: string;
}

interface LevelStyle {
  gradient: string;
  glow: string;
  pulse: string;
  badge: string;
  iconBg: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

const styles: Record<RiskLevel, LevelStyle> = {
  extremo: {
    gradient: 'from-purple-600/90 via-fuchsia-600/90 to-purple-700/90',
    glow: 'shadow-[0_0_40px_rgba(147,51,234,0.4)]',
    pulse: 'animate-pulse-glow-purple',
    badge: 'bg-purple-600/80',
    iconBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-600',
    icon: ShieldAlert,
    label: 'EMERGÊNCIA',
  },
  crítico: {
    gradient: 'from-red-500/90 to-orange-500/90',
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.4)]',
    pulse: 'animate-pulse-glow',
    badge: 'bg-red-500/80',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    icon: ShieldAlert,
    label: 'PERIGO',
  },
  alto: {
    gradient: 'from-orange-500/90 to-amber-500/90',
    glow: 'shadow-[0_0_25px_rgba(249,115,22,0.3)]',
    pulse: '',
    badge: 'bg-orange-500/80',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    icon: AlertCircle,
    label: 'ALERTA',
  },
  médio: {
    gradient: 'from-amber-400/90 to-yellow-400/90',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]',
    pulse: '',
    badge: 'bg-amber-400/80',
    iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    icon: AlertTriangle,
    label: 'ATENÇÃO',
  },
  baixo: {
    gradient: '',
    glow: '',
    pulse: '',
    badge: '',
    iconBg: '',
    icon: AlertCircle,
    label: '',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ level, title, message }) => {
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);

  const alertId = generateAlertId(level);
  const s = styles[level];

  useEffect(() => {
    if (level !== 'baixo') {
      setDismissed(isAlertDismissed(alertId));
    }
  }, [level, alertId]);

  useEffect(() => {
    if (level !== 'baixo') {
      const changed = hasRiskChanged(level);
      if (changed) {
        setDismissed(false);
        sendAlertNotification(`Alerta Recife: ${s.label}`, message, level, alertId);
      }
    }
  }, [level, message, s.label, alertId]);

  // Animação de entrada
  useEffect(() => {
    if (!dismissed && level !== 'baixo') {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [dismissed, level]);

  if (level === 'baixo' || dismissed) return null;

  const Icon = s.icon;
  const isHighRisk = level === 'crítico' || level === 'extremo';

  return (
    <div
      className={`mx-4 mt-3 rounded-2xl overflow-hidden transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      } ${s.pulse}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`relative backdrop-blur-xl bg-gradient-to-br ${s.gradient} ${s.glow} p-4 text-white`}>
        {/* Brilho no topo */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="flex items-start gap-3">
          {/* Ícone 3D */}
          <div className={`p-2.5 rounded-xl ${s.iconBg} shadow-lg ${isHighRisk ? 'animate-float' : ''}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
              {s.label}
            </span>
            <h4 className="text-sm font-black leading-tight mt-0.5">{title}</h4>
            <p className="text-xs font-semibold opacity-90 mt-1 line-clamp-3">{message}</p>

            {/* Botões vidro */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  dismissAlert(alertId);
                  setDismissed(true);
                }}
                className="px-4 py-2 text-[11px] font-black bg-white/20 hover:bg-white/30 rounded-full active:scale-95 transition-all flex items-center gap-1.5 backdrop-blur"
              >
                <X size={12} /> Entendi
              </button>
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 text-[11px] font-black bg-white/20 hover:bg-white/30 rounded-full active:scale-95 transition-all flex items-center gap-1.5 backdrop-blur"
              >
                {Notification.permission === 'granted' ? (
                  <><Bell size={12} /> Alertas ativos</>
                ) : (
                  <><BellOff size={12} /> Ativar alertas</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
