import { useEffect, useRef } from 'react'

/**
 * GoogleAd — Google AdSense display unit
 *
 * Setup (una volta ottenuto l'account AdSense):
 *   1. In index.html, de-commenta il tag <script> e sostituisci ca-pub-XXXXXXXXXXXXXXXX
 *   2. Sostituisci ADSENSE_PUBLISHER_ID qui sotto con il tuo Publisher ID
 *   3. Passa il corretto `slot` a ogni <GoogleAd> (trovalo in AdSense > Annunci > Per unità)
 */

// ← Sostituisci con il tuo Publisher ID quando l'account è attivo
const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'

export default function GoogleAd({ slot = 'XXXXXXXXXX', format = 'auto', style = {} }) {
  const ref = useRef(null)
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (isDev) return
    if (!ref.current || ref.current.dataset.adsbygoogleStatus) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (_) {
      // AdSense script non ancora caricato
    }
  }, [isDev])

  // Placeholder visivo in sviluppo
  if (isDev) {
    return (
      <div style={{
        width: '100%',
        minHeight: 90,
        borderRadius: 14,
        backgroundColor: '#F4F4F4',
        border: '1.5px dashed #CCCCCC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        ...style,
      }}>
        <span style={{ fontSize: 10, color: '#AAAAAA', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
          GOOGLE AD · {format}
        </span>
        <span style={{ fontSize: 9, color: '#CCCCCC', fontFamily: 'monospace' }}>
          slot {slot}
        </span>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden', borderRadius: 14, ...style }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
