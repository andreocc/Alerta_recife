/**
 * NotificationService — Sistema de alertas locais para o PWA.
 *
 * Estratégia (sem servidor de push):
 * 1. Notificações locais via `new Notification()` — funciona em PWA standalone
 * 2. Fallback via Service Worker `showNotification()` para background
 * 3. Preferência do usuário salva em localStorage
 *
 * iOS: notificações push não são suportadas em PWA — o AlertBanner UI cobre isso.
 */

import type { RiskLevel } from '../types';

const STORAGE_KEY = 'alert_prefs_recife_v1';

interface AlertPrefs {
  /** Se o usuário concedeu permissão de notificação */
  notificationsEnabled: boolean;
  /** Último nível de risco visto (para detectar mudanças) */
  lastRiskLevel: RiskLevel | null;
  /** IDs de alertas já dispensados (evita repetir) */
  dismissedAlerts: string[];
}

function loadPrefs(): AlertPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { notificationsEnabled: false, lastRiskLevel: null, dismissedAlerts: [] };
}

function savePrefs(prefs: AlertPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

/**
 * Solicita permissão de notificação ao usuário.
 * Deve ser chamada após interação (clique) para evitar bloqueio do navegador.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Notif] Notification API não disponível');
    return false;
  }

  if (Notification.permission === 'granted') {
    const prefs = loadPrefs();
    prefs.notificationsEnabled = true;
    savePrefs(prefs);
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  // Solicita permissão
  const result = await Notification.requestPermission();
  const granted = result === 'granted';

  if (granted) {
    const prefs = loadPrefs();
    prefs.notificationsEnabled = true;
    savePrefs(prefs);
  }

  return granted;
}

/**
 * Verifica se o nível de risco mudou em relação ao último visto.
 */
export function hasRiskChanged(current: RiskLevel): boolean {
  const prefs = loadPrefs();
  if (!prefs.lastRiskLevel) {
    // Primeira vez — salva mas não notifica
    prefs.lastRiskLevel = current;
    savePrefs(prefs);
    return false;
  }
  const changed = prefs.lastRiskLevel !== current;
  if (changed) {
    prefs.lastRiskLevel = current;
    savePrefs(prefs);
  }
  return changed;
}

/**
 * Envia uma notificação local.
 * Em PWA standalone, usa Notification API diretamente.
 * Também tenta via Service Worker para cobertura em background.
 */
export async function sendAlertNotification(
  title: string,
  body: string,
  level: RiskLevel,
  alertId: string
): Promise<void> {
  const prefs = loadPrefs();

  if (!prefs.notificationsEnabled) return;
  if (prefs.dismissedAlerts.includes(alertId)) return;

  const icon = '/icons/icon-192.png';
  const badge = '/icons/badge-72.png';

  const options = {
    body,
    icon,
    badge,
    tag: `risk-alert-${alertId}`,
    renotify: true,
    requireInteraction: level === 'crítico' || level === 'extremo',
    vibrate: level === 'baixo' || level === 'médio'
      ? [200, 100, 200]
      : [500, 200, 500, 200, 500],
    data: { url: '/', level, alertId },
  } as NotificationOptions;

  // Tenta via Service Worker primeiro (mais confiável)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'RISK_ALERT',
        payload: { title, body, level, id: alertId, options },
      });
      return;
    } catch {
      // Fallback para Notification direta
    }
  }

  // Fallback: Notification API direta
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, options);
    } catch (err) {
      console.error('[Notif] Erro ao enviar notificação:', err);
    }
  }
}

/**
 * Dispensa um alerta (não será mostrado novamente para este evento).
 */
export function dismissAlert(alertId: string): void {
  const prefs = loadPrefs();
  if (!prefs.dismissedAlerts.includes(alertId)) {
    prefs.dismissedAlerts.push(alertId);
  }
  savePrefs(prefs);
}

/**
 * Verifica se um alerta já foi dispensado.
 */
export function isAlertDismissed(alertId: string): boolean {
  const prefs = loadPrefs();
  return prefs.dismissedAlerts.includes(alertId);
}

/**
 * Gera um ID único de alerta baseado na data e nível.
 */
export function generateAlertId(level: RiskLevel): string {
  const today = new Date().toISOString().substring(0, 10); // "2025-01-15"
  return `risk-${level}-${today}`;
}

/**
 * Limpa alertas dispensados antigos (mantém últimos 20).
 */
export function cleanupOldAlerts(): void {
  const prefs = loadPrefs();
  if (prefs.dismissedAlerts.length > 20) {
    prefs.dismissedAlerts = prefs.dismissedAlerts.slice(-20);
    savePrefs(prefs);
  }
}
