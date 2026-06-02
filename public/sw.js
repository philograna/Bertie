// ─── Bertie Service Worker — Web Push ──────────────────────────────────────
const ICON  = '/bertie-logo.svg'
const BADGE = '/bertie-logo.svg'

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e  => e.waitUntil(self.clients.claim()))

// ── Ricevi notifica push dal server ─────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try { payload = event.data.json() }
  catch { payload = { title: 'Bertie', body: event.data.text() } }

  const { title = 'Bertie', body = '', url = '/', tag } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  ICON,
      badge: BADGE,
      tag:   tag || 'bertie-default',
      renotify: true,
      data: { url },
    })
  )
})

// ── Tap sulla notifica → apri/focalizza l'app ────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
      })
  )
})
