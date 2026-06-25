/**
 * Service Worker customizado do Alerta Recife.
 *
 * Registra listeners para notificações e gerencia cache.
 * A lista de precache é injetada pelo vite-plugin-pwa.
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// @ts-ignore — workbox injectManifest injection point
self.__WB_MANIFEST = [];

// ── Notificações ─────────────────────────────────────────

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data;

  if (!data || data.type !== 'RISK_ALERT') return;

  const { title, body, level, id, options } = data.payload;

  const notificationOptions = {
    body,
    icon: options?.icon || '/icons/icon-192.png',
    badge: options?.badge || '/icons/badge-72.png',
    vibrate: options?.vibrate || [200, 100, 200],
    tag: `risk-alert-${id}`,
    data: { url: '/', level, alertId: id },
    requireInteraction: level === 'crítico' || level === 'extremo',
    renotify: true,
  } as NotificationOptions;

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// ── Clique na notificação → abrir app ───────────────────

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (
          'focus' in client &&
          typeof client.url === 'string' &&
          client.url.includes(self.location.origin)
        ) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});
