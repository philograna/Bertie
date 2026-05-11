import { useEffect, useRef } from 'react'

/**
 * GoogleAd — Google AdSense sticky banner overlay (attaccato sopra la BottomNav)
 *
 * Setup (una volta ottenuto l'account AdSense):
 *   1. In index.html, de-commenta il tag <script> e sostituisci ca-pub-XXXXXXXXXXXXXXXX
 *   2. Sostituisci ADSENSE_PUBLISHER_ID con il tuo Publisher ID
 *   3. Sostituisci il valore di `slot` nel punto di utilizzo con il vero Ad Slot ID
 */

// ← Sostituisci con il tuo Publisher ID quando l'account è attivo
const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'

// Altezza stimata BottomNav (py-3 = 12px*2 + icona ~32px + label ~12px + safe-area)
const NAV_HEIGHT = 72

export default function GoogleAd({ slot = 'XXXXXXXXXX' }) {
  const ref = useRef(null)
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (isDev) return
    if (!ref.current || ref.current.dataset.adsbygoogleStatus) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (_) {}
  }, [isDev])

  return (
    <div style={{
      position: 'fixed',
      bottom: NAV_HEIGHT,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      zIndex: 40,
      pointerEvents: 'none',
    }}>
      <div style={{
        margin: '0 12px',
        borderRadius: '14px 14px 0 0',
        overflow: 'hidden',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
        pointerEvents: 'auto',
        backgroundColor: isDev ? '#F4F4F4' : '#FFFFFF',
        border: isDev ? '1.5px dashed #CCCCCC' : 'none',
        borderBottom: 'none',
      }}>
        {isDev ? (
          <div style={{
            height: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: 10, color: '#AAAAAA', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              GOOGLE DISPLAY AD
            </span>
            <span style={{ fontSize: 9, color: '#CCCCCC', fontFamily: 'monospace' }}>
              slot {slot}
            </span>
          </div>
        ) : (
          <ins
            ref={ref}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: 60 }}
            data-ad-client={ADSENSE_PUBLISHER_ID}
            data-ad-slot={slot}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </div>
  )
}
