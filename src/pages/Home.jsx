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

        {/* ── Status bar placeholder ── */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 shrink-0"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#2A2C2C' }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Signal bars */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="#2A2C2C">
              <rect x="0" y="6" width="3" height="6" rx="0.6"/>
              <rect x="5" y="3" width="3" height="9" rx="0.6"/>
              <rect x="10" y="0" width="3" height="12" rx="0.6"/>
            </svg>
            {/* Battery */}
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="#2A2C2C" strokeWidth="1.5">
              <rect x="0.75" y="0.75" width="20" height="10.5" rx="2.5"/>
              <rect x="2.5" y="2.5" width="13" height="7" rx="1" fill="#2A2C2C"/>
              <rect x="22" y="4" width="1.5" height="4" rx="0.5" fill="#2A2C2C"/>
            </svg>
          </div>
        </div>

        {/* ── Top mini bar: logo + brand + language ── */}
        <div className="flex items-center justify-between px-6 pt-3 pb-0 shrink-0">
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              backgroundColor: '#FBF6E2',
              display: 'grid', placeItems: 'center', overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(70,73,73,0.08)',
            }}>
              <img src="/bertie-logo.svg" alt="Bertie"
                style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              letterSpacing: '-0.02em',
              color: '#2A2C2C',
            }}>
              Ber<em style={{ fontStyle: 'italic', color: '#D28C45' }}>tie</em>
            </span>
          </div>
          {/* Language pill */}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#464949',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            padding: '6px 10px',
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.5)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}>
            {/* Gold dot */}
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E8A859', display: 'inline-block' }} />
            IT
          </span>
        </div>

        {/* ── Center hero ── */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4">

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
            Un solo posto<br />
            per tutta la vita<br />
            del tuo <em style={{ fontStyle: 'italic', color: '#D28C45' }}>cane</em>.
          </h2>

          {/* Subtitle */}
          <p style={{
            margin: 0,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: '#464949',
            maxWidth: '28ch',
          }}>
            Vaccini, salute, mappa dog-friendly — in italiano.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="px-6 flex flex-col gap-2.5 shrink-0">
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
            {/* Gold circle arrow */}
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
