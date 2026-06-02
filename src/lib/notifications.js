import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

/** Converte la VAPID public key in Uint8Array per il browser */
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

/** Registra il Service Worker se non già attivo */
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    return reg
  } catch (err) {
    console.warn('[Bertie] SW registration failed:', err)
    return null
  }
}

/**
 * Chiedi permesso e iscriviti alle push.
 * Salva la subscription in Supabase (notification_tokens).
 * Restituisce true se tutto ok, false altrimenti.
 */
export async function initNotifications(userId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Bertie] Push non supportato su questo browser')
    return false
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Bertie] VITE_VAPID_PUBLIC_KEY non configurata')
    return false
  }

  try {
    // 1. Richiedi permesso
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // 2. Ottieni subscription
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // 3. Salva in Supabase
    const subJson = sub.toJSON()
    await supabase.from('notification_tokens').upsert(
      {
        user_id:      userId,
        token:        subJson.endpoint,
        subscription: subJson,
        platform:     'web',
      },
      { onConflict: 'user_id,platform' }
    )

    return true
  } catch (err) {
    console.error('[Bertie] Push registration error:', err)
    return false
  }
}

/**
 * Mostra una notifica locale immediata (via SW, senza server).
 * Utile per il benvenuto post-onboarding.
 */
export async function showLocalNotification({ title, body, url = '/dashboard' }) {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon:  '/bertie-logo.svg',
      badge: '/bertie-logo.svg',
      data:  { url },
    })
  } catch (err) {
    console.warn('[Bertie] showLocalNotification:', err)
  }
}

/**
 * Rimuovi la subscription push dell'utente corrente
 * (es. al logout o alla revoca permessi).
 */
export async function unsubscribePush(userId) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    if (userId) {
      await supabase.from('notification_tokens')
        .delete().eq('user_id', userId).eq('platform', 'web')
    }
  } catch (err) {
    console.warn('[Bertie] unsubscribePush:', err)
  }
}
