import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  biscuit: '#F6ECC8',
  gold:    '#E8A859',
  honey:   '#D28C45',
  bowtie:  '#464949',
  muted:   '#6B6E6E',
  cream50: '#FBF6E2',
  cream200:'#EFE0A8',
  white:   '#FFFFFF',
}

// ─── Fade-in on scroll ────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useFadeIn()
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      backgroundColor: scrolled ? 'rgba(246,236,200,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      transition: 'background-color 0.3s, backdrop-filter 0.3s',
      borderBottom: scrolled ? `1px solid ${C.cream200}` : 'none',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo placeholder — vuoto */}
        <div />

        <div />
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | duplicate | error
  const [msg, setMsg]       = useState('')

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setMsg('Inserisci un indirizzo email valido.')
      setStatus('error')
      return
    }
    setStatus('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })
    if (error) {
      if (error.code === '23505') {
        setMsg('Sei già in lista! Ti contatteremo presto.')
        setStatus('duplicate')
      } else {
        setMsg('Qualcosa è andato storto. Riprova tra poco.')
        setStatus('error')
      }
    } else {
      setMsg('Perfetto! Ti avviseremo non appena Bertie sarà disponibile. 🎉')
      setStatus('success')
      setEmail('')
    }
  }

  return (
    <section style={{
      backgroundColor: C.biscuit,
      backgroundImage: `
        radial-gradient(600px 400px at 80% 20%, rgba(232,168,89,0.18), transparent 65%),
        radial-gradient(400px 300px at 10% 80%, rgba(183,115,54,0.10), transparent 60%)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px 48px',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

        {/* Eyebrow */}
        <FadeIn>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: C.honey, marginBottom: 20,
          }}>
            <span style={{ width: 14, height: 1, backgroundColor: C.honey, display: 'inline-block' }} />
            L'app per chi ama davvero il proprio cane
            <span style={{ width: 14, height: 1, backgroundColor: C.honey, display: 'inline-block' }} />
          </div>
        </FadeIn>

        {/* Logo + wordmark centrati */}
        <FadeIn delay={40}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 10 }}>

            <img src="/bertie-logo.svg" alt="Bertie logo"
              style={{ width: 160, height: 160, objectFit: 'contain' }} />

            <img src="/bertie-wordmark.svg" alt="Bertie"
              style={{ height: 60, objectFit: 'contain' }} />
          </div>
        </FadeIn>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {/* Headline */}
        <FadeIn delay={80}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'clamp(26px, 5vw, 44px)', lineHeight: 1.1,
            letterSpacing: '-0.025em', color: C.bowtie, margin: '0 0 16px',
          }}>
            Tutta la vita del tuo cane,<br />
            <em style={{ fontStyle: 'italic', color: C.gold }}>in un posto solo.</em>
          </h1>
        </FadeIn>

        {/* Sottotitolo */}
        <FadeIn delay={140}>
          <p style={{
            fontSize: 16, lineHeight: 1.65, color: C.muted,
            maxWidth: 440, margin: '0 auto 28px',
          }}>
            Vaccini, antiparassitari, mappa dog-friendly e molto altro.
          </p>
        </FadeIn>

        {/* Form email waitlist */}
        <FadeIn delay={200}>
          {status === 'success' || status === 'duplicate' ? (
            <div style={{
              backgroundColor: 'rgba(232,168,89,0.15)', borderRadius: 16,
              padding: '16px 24px', border: `1px solid ${C.cream200}`,
              marginBottom: 20,
            }}>
              <p style={{ color: C.honey, fontWeight: 600, fontSize: 15, margin: 0 }}>{msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                  style={{
                    flex: '1 1 200px', maxWidth: 280,
                    padding: '13px 20px', borderRadius: 999,
                    border: status === 'error'
                      ? '1.5px solid rgba(176,64,64,0.5)'
                      : `1.5px solid ${C.cream200}`,
                    backgroundColor: C.cream50,
                    color: C.bowtie, fontSize: 14, outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    padding: '13px 24px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                    backgroundColor: C.gold, color: C.white, border: 'none',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: status === 'loading' ? 0.75 : 1,
                    boxShadow: '0 6px 20px -4px rgba(232,168,89,0.5)',
                  }}
                  onMouseOver={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = C.honey }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = C.gold }}>
                  {status === 'loading'
                    ? <span style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: C.white, borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.7s linear infinite',
                      }} />
                    : 'Entra in lista'}
                </button>
              </div>
              {status === 'error' && (
                <p style={{ color: '#B04040', fontSize: 13, marginTop: 8 }}>{msg}</p>
              )}
            </form>
          )}
        </FadeIn>

        {/* Social proof */}
        <FadeIn delay={280}>
          <p style={{ fontSize: 12, color: C.muted, letterSpacing: '0.02em' }}>
            🐾 Già <strong style={{ color: C.bowtie }}>1.200+ proprietari</strong> in lista d'attesa
          </p>
        </FadeIn>

      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '🩺',
    title: 'Fascicolo sanitario digitale',
    desc: 'Vaccini, antiparassitari e visite sempre a portata di mano. Condividi il fascicolo con il tuo veterinario in un click.',
  },
  {
    emoji: '🗺️',
    title: 'Mappa dog-friendly',
    desc: 'Parchi, spiagge e ristoranti pet-friendly in tutta Italia. Trova i posti migliori per te e il tuo cane.',
  },
  {
    emoji: '✂️',
    title: 'Prenota il toelettatore',
    desc: 'Trova e prenota i migliori groomer vicino a te. Storico delle toelettature sempre disponibile.',
  },
  {
    emoji: '🐾',
    title: 'Community locale',
    desc: 'Connettiti con altri proprietari di cani nella tua zona. Organizza passeggiate di gruppo.',
  },
]

function Features() {
  return (
    <section id="features" style={{ backgroundColor: C.cream50, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>

        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: C.honey, marginBottom: 12 }}>
              Tutto in un'app
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em',
              color: C.bowtie, margin: 0 }}>
              Pensato per la vita{' '}
              <em style={{ fontStyle: 'italic', color: C.gold }}>vera</em>.
            </h2>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 80}>
              <div style={{
                backgroundColor: C.white, borderRadius: 18,
                padding: '28px 24px',
                boxShadow: '0 2px 16px rgba(70,73,73,0.07)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(70,73,73,0.12)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(70,73,73,0.07)'
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: C.biscuit,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>
                  {f.emoji}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400,
                  fontSize: 20, color: C.bowtie, margin: '0 0 10px',
                  letterSpacing: '-0.01em' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: C.muted, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  'Profilo cane (fino a 2 animali)',
  'Tracker vaccini con reminder',
  'Calendario antiparassitari',
  'Diario salute',
  'Mappa dog-friendly',
  '1 banner in fondo all\'app',
]
const SUPPORTER_FEATURES = [
  'Tutto il piano gratuito',
  'Zero pubblicità',
  'Badge Supporter nel profilo',
  'Accesso anticipato alle nuove feature',
  'Meno di €1 al mese',
]

function PricingCheck({ light }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={light ? 'rgba(232,168,89,0.85)' : C.honey} strokeWidth="2.5"
      style={{ flexShrink: 0 }}>
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function Pricing() {
  const navigate = useNavigate()
  return (
    <section id="pricing" style={{ backgroundColor: C.biscuit, padding: '72px 24px 80px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(26px, 5vw, 40px)', letterSpacing: '-0.02em',
              color: C.bowtie, margin: '0 0 12px', lineHeight: 1.1,
            }}>
              Bertie è gratis.{' '}
              <em style={{ fontStyle: 'italic', color: C.gold }}>Per sempre.</em>
            </h2>
            <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              Chi vuole supportare il progetto può diventare Supporter.
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>

          {/* ── Gratis ── */}
          <FadeIn delay={0}>
            <div style={{
              backgroundColor: C.cream50, borderRadius: 22,
              padding: '32px 28px',
              border: `1.5px solid ${C.cream200}`,
              display: 'flex', flexDirection: 'column',
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: C.muted, marginBottom: 8,
              }}>
                Gratuito
              </p>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 42,
                color: C.bowtie, margin: '0 0 4px', letterSpacing: '-0.02em',
              }}>
                €0
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
                Gratis per sempre
              </p>
              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 0', flex: 1,
                display: 'flex', flexDirection: 'column', gap: 11,
              }}>
                {FREE_FEATURES.map(f => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: C.bowtie,
                  }}>
                    <PricingCheck />{f}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          {/* ── Supporter ── */}
          <FadeIn delay={100}>
            <div style={{
              backgroundColor: C.bowtie, borderRadius: 22,
              padding: '32px 28px',
              boxShadow: '0 20px 48px -16px rgba(70,73,73,0.50)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* decoration */}
              <div style={{
                position: 'absolute', right: -40, top: -40, width: 160, height: 160,
                backgroundColor: 'rgba(232,168,89,0.08)', borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', left: -30, bottom: -30, width: 120, height: 120,
                backgroundColor: 'rgba(232,168,89,0.05)', borderRadius: '50%', pointerEvents: 'none',
              }} />

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'rgba(232,168,89,0.70)', marginBottom: 8,
                position: 'relative',
              }}>
                Supporter
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4, position: 'relative' }}>
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 42,
                  color: C.white, margin: 0, letterSpacing: '-0.02em',
                }}>
                  €9,99
                </p>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', paddingBottom: 9 }}>
                  /anno
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginBottom: 28, position: 'relative' }}>
                Rinnovo annuale · annulla quando vuoi
              </p>

              <ul style={{
                listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1,
                display: 'flex', flexDirection: 'column', gap: 11, position: 'relative',
              }}>
                {SUPPORTER_FEATURES.map(f => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: 'rgba(255,255,255,0.88)',
                  }}>
                    <PricingCheck light />{f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/registrati')}
                style={{
                  width: '100%', padding: '14px', borderRadius: 999, fontSize: 14,
                  fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
                  backgroundColor: C.gold, color: C.white, border: 'none',
                  boxShadow: '0 6px 20px rgba(232,168,89,0.35)',
                  position: 'relative',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                Diventa Supporter
              </button>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  )
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────
function Waitlist() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error | duplicate
  const [msg, setMsg]       = useState('')

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setMsg('Inserisci un indirizzo email valido.')
      setStatus('error')
      return
    }
    setStatus('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })
    if (error) {
      if (error.code === '23505') {
        setMsg('Sei già in lista! Ti contatteremo presto.')
        setStatus('duplicate')
      } else {
        setMsg('Qualcosa è andato storto. Riprova tra poco.')
        setStatus('error')
      }
    } else {
      setMsg('Perfetto! Ti avviseremo non appena Bertie sarà disponibile. 🎉')
      setStatus('success')
      setEmail('')
    }
  }

  return (
    <section style={{ backgroundColor: C.cream50, padding: '80px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <FadeIn>
          <div style={{
            backgroundColor: C.bowtie,
            borderRadius: 24,
            padding: 'clamp(36px, 6vw, 64px) clamp(24px, 5vw, 56px)',
            textAlign: 'center',
            backgroundImage: 'radial-gradient(500px 350px at 80% 20%, rgba(232,168,89,0.10), transparent 60%)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Decorazione sfondo */}
            <div style={{
              position: 'absolute', left: -60, bottom: -60,
              width: 220, height: 220, borderRadius: '50%',
              backgroundColor: 'rgba(232,168,89,0.06)', pointerEvents: 'none',
            }} />

            {/* Eyebrow */}
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: 'rgba(232,168,89,0.75)', marginBottom: 16,
            }}>
              Early access
            </p>

            {/* Titolo */}
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(32px, 5vw, 48px)', letterSpacing: '-0.02em',
              color: C.white, margin: '0 0 16px', lineHeight: 1.1,
            }}>
              Bertie sta{' '}
              <em style={{ fontStyle: 'italic', color: C.gold }}>arrivando.</em>
            </h2>

            {/* Sottotitolo */}
            <p style={{
              fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.60)',
              margin: '0 auto 24px', maxWidth: 380,
            }}>
              Entra in lista e ricevi l'accesso in anteprima.<br />
              Gratis, senza impegno.
            </p>

            {/* Social proof */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: 'rgba(232,168,89,0.14)',
              border: '1px solid rgba(232,168,89,0.25)',
              borderRadius: 999, padding: '7px 16px',
              fontSize: 13, color: 'rgba(255,255,255,0.8)',
              marginBottom: 32,
            }}>
              🐾 Già <strong style={{ color: C.gold }}>1.200+</strong> proprietari in lista d'attesa
            </div>

            {/* Form / Feedback */}
            {status === 'success' || status === 'duplicate' ? (
              <div style={{
                backgroundColor: 'rgba(232,168,89,0.15)', borderRadius: 16,
                padding: '18px 24px', border: '1px solid rgba(232,168,89,0.30)',
              }}>
                <p style={{ color: C.gold, fontWeight: 600, fontSize: 15, margin: 0 }}>{msg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{
                  display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
                }}>
                  <input
                    type="email"
                    placeholder="La tua email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                    style={{
                      flex: '1 1 220px', maxWidth: 300,
                      padding: '14px 20px', borderRadius: 999,
                      border: status === 'error'
                        ? '1.5px solid rgba(240,100,100,0.6)'
                        : '1.5px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: C.white, fontSize: 14, outline: 'none',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                      padding: '14px 28px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                      backgroundColor: C.gold, color: C.white, border: 'none',
                      cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s', flexShrink: 0, minWidth: 148,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      opacity: status === 'loading' ? 0.75 : 1,
                    }}
                    onMouseOver={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = C.honey }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = C.gold }}>
                    {status === 'loading'
                      ? <span style={{
                          width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: C.white, borderRadius: '50%',
                          display: 'inline-block', animation: 'spin 0.7s linear infinite',
                        }} />
                      : 'Entra in lista'}
                  </button>
                </div>
                {status === 'error' && (
                  <p style={{ color: '#F0A0A0', fontSize: 13, marginTop: 10, margin: '10px 0 0' }}>
                    {msg}
                  </p>
                )}
              </form>
            )}
          </div>
        </FadeIn>
      </div>

      {/* keyframe per lo spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const linkStyle = {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    textDecoration: 'none', transition: 'color 0.2s',
  }
  const hover = { color: 'rgba(255,255,255,0.85)' }
  return (
    <footer style={{ backgroundColor: C.bowtie, borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '24px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>Ber</span>
          <em style={{ color: C.gold, fontStyle: 'italic' }}>tie</em>
        </span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/privacy" style={linkStyle}
            onMouseOver={e => Object.assign(e.currentTarget.style, hover)}
            onMouseOut={e => Object.assign(e.currentTarget.style, linkStyle)}>
            Privacy Policy
          </a>
          <a href="/termini" style={linkStyle}
            onMouseOver={e => Object.assign(e.currentTarget.style, hover)}
            onMouseOut={e => Object.assign(e.currentTarget.style, linkStyle)}>
            Termini e condizioni
          </a>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>
            © 2025 Bertie
          </span>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', backgroundColor: C.biscuit }}>
      <Navbar />
      <Hero />
      <Pricing />
      <Footer />
    </div>
  )
}
