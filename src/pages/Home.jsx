import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: '#F6ECC8', fontFamily: 'var(--font-sans)' }}
    >
      {/* ── Phone-width container ── */}
      <div
        className="w-full flex flex-col relative overflow-hidden"
        style={{
          maxWidth: 430,
          minHeight: '100svh',
          backgroundColor: '#F6ECC8',
          /* Decorative radial gradients from handoff */
          backgroundImage: `
            radial-gradient(420px 280px at 75% 18%, rgba(232,168,89,0.22), transparent 70%),
            radial-gradient(360px 240px at 15% 78%, rgba(183,115,54,0.10), transparent 65%)
          `,
        }}
      >

        {/* ── Wordmark + hero come blocco unico ── */}
        <div className="flex-1 flex flex-col items-center justify-start text-center px-6 pt-20 pb-4">

          {/* Wordmark SVG */}
          <img
            src="/bertie-wordmark.svg"
            alt="Bertie"
            style={{ width: 320, marginBottom: 8 }}
          />

          {/* Eyebrow line */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#B77336',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 22,
          }}>
            <span style={{ width: 14, height: 1, backgroundColor: '#B77336', display: 'inline-block' }} />
            L'app italiana per chi ha un cane
            <span style={{ width: 14, height: 1, backgroundColor: '#B77336', display: 'inline-block' }} />
          </div>

          {/* Big logo with gold halo */}
          <div style={{ position: 'relative', width: 180, height: 180, display: 'grid', placeItems: 'center', marginBottom: 26 }}>
            {/* Halo */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(232,168,89,0.38), transparent 72%)',
              filter: 'blur(2px)',
            }} />
            <img
              src="/bertie-logo.svg"
              alt="Bertie"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 18px 30px rgba(140,85,36,0.28))',
              }}
            />
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#2A2C2C',
            margin: '0 0 14px',
          }}>
            Un solo posto per tutta la vita del tuo <em style={{ fontStyle: 'italic', color: '#D28C45' }}>cane</em>.
          </h2>

          {/* Subtitle */}
          <p style={{
            margin: '0 0 28px',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: '#464949',
            maxWidth: '28ch',
          }}>
            Vaccini, salute, mappa dog-friendly.
          </p>

          {/* ── CTAs ── */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Primary: dark ink with gold arrow */}
            <button
              onClick={() => navigate('/registrati')}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: 999,
                border: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 500,
                backgroundColor: '#2A2C2C',
                color: '#F6ECC8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              Aggiungi il tuo cane
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                backgroundColor: '#E8A859',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2A2C2C" strokeWidth="3">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </span>
            </button>

            {/* Ghost: login */}
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '15px 18px',
                borderRadius: 999,
                border: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: '#2A2C2C',
                boxShadow: 'inset 0 0 0 1.5px #2A2C2C',
                cursor: 'pointer',
              }}
            >
              Ho già un account · Accedi
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0 mt-2"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#6B6E6E',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
          }}>
          <span>
            <span style={{ color: '#2A2C2C', fontWeight: 500 }}>7M+</span>{' '}cani in Italia
          </span>
          <span style={{ color: '#464949', borderBottom: '1px dotted #A7A8A8', paddingBottom: 1, cursor: 'pointer' }}>
            Privacy
          </span>
        </div>

      </div>
    </div>
  )
}
