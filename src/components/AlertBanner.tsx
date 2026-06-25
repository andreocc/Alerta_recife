/**
 * AlertBanner — Banner de alerta mobile-first para mudanças de nível de risco.
 *
 * Exibido abaixo do header quando o nível de risco é médio ou superior.
 * Anima com entrada suave, cores por nível, e botão "Entendi" para dismiss.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Zap,
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

const levelConfig: Record<RiskLevel, {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}> = {
  extremo: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-600/40',
    text: 'text-purple-800 dark:text-purple-100',
    iconBg: 'bg-purple-600',
    icon: ShieldAlert,
    label: 'EMERGÊNCIA',
  },
  crítico: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-500/40',
    text: 'text-red-800 dark:text-red-100',
    iconBg: 'bg-red-500',
    icon: ShieldAlert,
    label: 'PERIGO',
  },
  alto: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-500/40',
    text: 'text-orange-800 dark:text-orange-100',
    iconBg: 'bg-orange-500',
    icon: AlertCircle,
    label: 'ALERTA',
  },
  médio: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-500/40',
    text: 'text-amber-800 dark:text-amber-100',
    iconBg: 'bg-amber-500',
    icon: AlertTriangle,
    label: 'ATENÇÃO',
  },
  baixo: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-500/40',
    text: 'text-emerald-800 dark:text-emerald-100',
    iconBg: 'bg-emerald-500',
    icon: AlertCircle,
    label: 'NORMAL',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({ level, title, message }) => {
  const [dismissed, setDismissed] = useState(true);

  const alertId = generateAlertId(level);
  const config = levelConfig[level];

  // Verifica se o alerta já foi dispensado hoje
  useEffect(() => {
    if (level !== 'baixo') {
      setDismissed(isAlertDismissed(alertId));
    }
  }, [level, alertId]);

  // Detecta mudança de nível e dispara notificação
  useEffect(() => {
    if (level !== 'baixo') {
      const changed = hasRiskChanged(level);
      if (changed) {
        setDismissed(false);

        // Envia notificação local
        sendAlertNotification(
          `Alerta Recife: ${config.label}`,
          message,
          level,
          alertId
        );
      }
    }
  }, [level, message, config.label, alertId]);

  // Não mostra nada se nível é baixo ou foi dispensado
  if (level === 'baixo' || dismissed) return null;

  const Icon = config.icon;

  return (
    <div
      className={`animate-in slide-in-from-top-2 fade-in duration-300 ${config.bg} ${config.text} border ${config.border} rounded-2xl p-4 mx-4 mt-3 shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={`p-2 rounded-xl ${config.iconBg} text-white shrink-0`}>
          <Icon size={20} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
              {config.label}
            </span>
          </div>
          <h4 className="text-sm font-black leading-tight">{title}</h4>
          <p className="text-xs font-semibold opacity-80 mt-1 line-clamp-3">
            {message}
          </p>

          {/* Botões de ação */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                dismissAlert(alertId);
                setDismissed(true);
              }}
              className="px-4 py-1.5 text-[11px] font-black bg-white/80 dark:bg-black/30 rounded-full active:scale-95 transition-all flex items-center gap-1.5"
            >
              <X size={12} /> Entendi
            </button>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-1.5 text-[11px] font-black bg-white/80 dark:bg-black/30 rounded-full active:scale-95 transition-all flex items-center gap-1.5"
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
  );
};
