// ─── Bertie — Send Push Notifications (daily cron) ─────────────────────────
// Inviato come cron ogni giorno (es. 08:00 ora italiana).
// Logica:
//   • Vaccini (type='vaccine')      → reminder 30 giorni prima della scadenza
//   • Antiparassitari (type='antiparassitario') → reminder 7 giorni prima
//   • Compleanni                    → notifica il giorno stesso

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── VAPID helpers ────────────────────────────────────────────────────────────

function base64urlToUint8(base64url: string): Uint8Array {
  const pad = base64url.length % 4
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad ? 4 - pad : 0)
  const raw = atob(b64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

async function importVapidPrivateKey(privateKeyBase64url: string): Promise<CryptoKey> {
  const keyBytes = base64urlToUint8(privateKeyBase64url)
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )
}

async function importVapidPublicKey(publicKeyBase64url: string): Promise<CryptoKey> {
  const keyBytes = base64urlToUint8(publicKeyBase64url)
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign'],
  )
}

/** Crea il JWT VAPID per l'Authorization header */
async function buildVapidJWT(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const header  = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const unsigned = `${encode(header)}.${encode(payload)}`
  const msgBytes = new TextEncoder().encode(unsigned)

  // Import come ECDSA sign key (P-256)
  const rawPriv = base64urlToUint8(privateKeyB64)
  // Wrap in PKCS8 for ECDSA signing
  const pkcs8 = buildPkcs8(rawPriv)
  const sigKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, sigKey, msgBytes)
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${unsigned}.${sigB64}`
}

/** Costruisce un PKCS8 DER attorno ai 32 byte della chiave privata P-256 */
function buildPkcs8(rawPriv: Uint8Array): ArrayBuffer {
  // OID per id-ecPublicKey + namedCurve P-256
  const oidSeq = new Uint8Array([
    0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // id-ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // prime256v1
  ])
  // ECPrivateKey DER (version 1, no public key)
  const ecPriv = new Uint8Array([
    0x30, 0x27,
    0x02, 0x01, 0x01, // version 1
    0x04, 0x20, ...rawPriv, // private key octets
  ])
  const inner = new Uint8Array([...oidSeq, 0x04, ecPriv.length, ...ecPriv])
  return new Uint8Array([0x30, inner.length + 2, 0x02, 0x01, 0x00, ...inner]).buffer
}

// ── Web Push ────────────────────────────────────────────────────────────────

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const url      = new URL(subscription.endpoint)
    const audience = `${url.protocol}//${url.host}`
    const jwt      = await buildVapidJWT(audience, vapidSubject, vapidPrivate)

    const body = JSON.stringify(payload)

    // Per ora inviamo senza crittografia ECDH (plaintext) — sufficiente per lo smoke test
    // In produzione reale si usa web-push library con crittografia content-encoding: aes128gcm
    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
        'TTL':           '86400',
      },
      body,
    })

    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ── Helpers data ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000)
}

// ── Handler principale ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  ?? ''
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')     ?? 'mailto:hello@bertie.app'

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      throw new Error('VAPID keys non configurate')
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')             ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const todayStr = today()
    let sent = 0, failed = 0

    // 1. Recupera tutti i token push attivi (web)
    const { data: tokens, error: tokErr } = await admin
      .from('notification_tokens')
      .select('user_id, subscription')
      .eq('platform', 'web')

    if (tokErr) throw tokErr
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessun token trovato', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mappa userId → subscriptions (un utente potrebbe avere più device, ma upsert garantisce 1 per platform)
    const tokenMap = new Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }>()
    for (const t of tokens) {
      if (t.subscription?.endpoint && t.subscription?.keys) {
        tokenMap.set(t.user_id, t.subscription)
      }
    }

    const userIds = [...tokenMap.keys()]
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: 'Nessuna subscription valida', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Vaccini e antiparassitari in scadenza
    const { data: vaccini } = await admin
      .from('vaccines')
      .select('user_id, name, next_due, type')
      .in('user_id', userIds)
      .not('next_due', 'is', null)

    for (const v of vaccini ?? []) {
      const sub = tokenMap.get(v.user_id)
      if (!sub) continue

      const days = diffDays(v.next_due, todayStr)
      const isVaccine = v.type === 'vaccine'
      const threshold = isVaccine ? 30 : 7

      if (days !== threshold) continue // solo esattamente N giorni prima

      const label   = isVaccine ? 'vaccino' : 'antiparassitario'
      const payload = {
        title: `Reminder ${label}`,
        body:  `${v.name} scade tra ${days} giorni. Prenota dal veterinario!`,
        url:   '/dashboard?tab=salute',
        tag:   `vaccine-${v.user_id}-${v.name}`,
      }

      const res = await sendWebPush(sub, payload, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT)
      res.ok ? sent++ : failed++
    }

    // 3. Compleanni oggi
    const { data: dogs } = await admin
      .from('dogs')
      .select('user_id, name, birth_date')
      .in('user_id', userIds)
      .not('birth_date', 'is', null)

    for (const dog of dogs ?? []) {
      const sub = tokenMap.get(dog.user_id)
      if (!sub) continue

      // Confronta mese e giorno
      const birth = new Date(dog.birth_date)
      const now   = new Date(todayStr)
      if (birth.getMonth() !== now.getMonth() || birth.getDate() !== now.getDate()) continue

      const age = now.getFullYear() - birth.getFullYear()
      const payload = {
        title: `Buon compleanno ${dog.name}!`,
        body:  `Oggi ${dog.name} compie ${age} ${age === 1 ? 'anno' : 'anni'}. Festa!`,
        url:   '/dashboard',
        tag:   `birthday-${dog.user_id}`,
      }

      const res = await sendWebPush(sub, payload, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT)
      res.ok ? sent++ : failed++
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, date: todayStr }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-notifications]', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
