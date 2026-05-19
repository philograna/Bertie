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

        {/* Logo */}
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ color: C.bowtie }}>Ber</span>
          <em style={{ color: C.gold, fontStyle: 'italic' }}>tie</em>
        </span>

        {/* Links desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: C.muted,
            textDecoration: 'none', display: 'none' }}
            className="md-show">Come funziona</a>
          <a href="#pricing" style={{ fontSize: 14, fontWeight: 500, color: C.muted,
            textDecoration: 'none', display: 'none' }}
            className="md-show">Prezzi</a>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/login')}
              style={{ fontSize: 13, fontWeight: 500, color: C.bowtie,
                background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>
              Accedi
            </button>
            <button onClick={() => navigate('/registrati')}
              style={{ fontSize: 13, fontWeight: 600, color: C.white,
                backgroundColor: C.gold, border: 'none', borderRadius: 999,
                padding: '9px 20px', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = C.honey}
              onMouseOut={e => e.currentTarget.style.backgroundColor = C.gold}>
              Inizia gratis
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate()
  return (
    <section style={{
      minHeight: '100svh', backgroundColor: C.biscuit,
      backgroundImage: `
        radial-gradient(600px 400px at 80% 20%, rgba(232,168,89,0.18), transparent 65%),
        radial-gradient(400px 300px at 10% 80%, rgba(183,115,54,0.10), transparent 60%)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '100px 24px 64px',
    }}>
      <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>

        {/* Eyebrow */}
        <FadeIn>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: C.honey, marginBottom: 24,
          }}>
            <span style={{ width: 14, height: 1, backgroundColor: C.honey, display: 'inline-block' }} />
            L'app per chi ama davvero il proprio cane
            <span style={{ width: 14, height: 1, backgroundColor: C.honey, display: 'inline-block' }} />
          </div>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={80}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'clamp(36px, 7vw, 64px)', lineHeight: 1.05,
            letterSpacing: '-0.025em', color: C.bowtie, margin: '0 0 20px',
          }}>
            Tutta la vita del tuo cane,{' '}
            <em style={{ fontStyle: 'italic', color: C.gold }}>in un posto solo.</em>
          </h1>
        </FadeIn>

        {/* Sottotitolo */}
        <FadeIn delay={160}>
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: C.muted,
            maxWidth: 520, margin: '0 auto 36px',
          }}>
            Vaccini, antiparassitari, mappa dog-friendly e molto altro.
            In italiano, fatto per chi ama davvero il proprio cane.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={240}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/registrati')}
              style={{
                fontSize: 15, fontWeight: 600, color: C.white,
                backgroundColor: C.gold, border: 'none', borderRadius: 999,
                padding: '14px 32px', cursor: 'pointer', transition: 'background-color 0.2s',
                boxShadow: '0 8px 24px -6px rgba(232,168,89,0.55)',
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = C.honey}
              onMouseOut={e => e.currentTarget.style.backgroundColor = C.gold}>
              Inizia gratis →
            </button>
            <a href="#features"
              style={{
                fontSize: 15, fontWeight: 500, color: C.bowtie,
                backgroundColor: 'transparent',
                border: `1.5px solid ${C.bowtie}`,
                borderRadius: 999, padding: '13px 28px',
                cursor: 'pointer', textDecoration: 'none', transition: 'opacity 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.65'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              Scopri come funziona
            </a>
          </div>
        </FadeIn>

        {/* Social proof */}
        <FadeIn delay={320}>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 32, letterSpacing: '0.02em' }}>
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
  'Diario salute base',
  'Mappa dog-friendly',
]
const PREMIUM_FEATURES = [
  'Tutto il piano Free',
  'Animali illimitati',
  'Prenotazione groomer e dog sitter',
  'Fascicolo sanitario condivisibile',
  'Community locale e passeggiate',
  'Storico completo visite veterinarie',
]

function Check({ gold }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={gold ? C.gold : C.bowtie} strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function Pricing() {
  const navigate = useNavigate()
  return (
    <section id="pricing" style={{ backgroundColor: C.biscuit, padding: '80px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: C.honey, marginBottom: 12 }}>
              Prezzi
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em',
              color: C.bowtie, margin: 0 }}>
              Semplice. Trasparente.{' '}
              <em style={{ fontStyle: 'italic', color: C.gold }}>Per tutti.</em>
            </h2>
          </div>
        </FadeIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

          {/* Free */}
          <FadeIn delay={0}>
            <div style={{
              backgroundColor: C.cream50, borderRadius: 22,
              padding: '32px 28px', border: `1.5px solid ${C.cream200}`,
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: C.muted, marginBottom: 8 }}>
                Free
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 40,
                color: C.bowtie, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                €0
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Per sempre gratuito</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FREE_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: C.bowtie }}>
                    <Check />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/registrati')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 999, fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s',
                  backgroundColor: 'transparent', color: C.bowtie,
                  border: `1.5px solid ${C.bowtie}`,
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.6'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                Inizia gratis
              </button>
            </div>
          </FadeIn>

          {/* Premium */}
          <FadeIn delay={120}>
            <div style={{
              backgroundColor: C.gold, borderRadius: 22,
              padding: '32px 28px',
              boxShadow: '0 16px 40px -12px rgba(232,168,89,0.55)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorazione */}
              <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160,
                backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', right: 20, top: 20 }}>
                <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.25)',
                  color: C.white, padding: '4px 10px', borderRadius: 999,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Consigliato
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                Premium
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 40,
                  color: C.white, margin: 0, letterSpacing: '-0.02em' }}>
                  €0,99
                </p>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', paddingBottom: 8 }}>/mese</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 28 }}>
                Annulla in qualsiasi momento
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PREMIUM_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 14, color: C.white }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.9)" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/registrati')}
                style={{
                  width: '100%', padding: '13px', borderRadius: 999, fontSize: 14,
                  fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
                  backgroundColor: C.white, color: C.gold, border: 'none',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                Inizia con Premium
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
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [msg, setMsg]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })
    if (error) {
      if (error.code === '23505') {
        setMsg('Sei già in lista! Ti avviseremo presto. 🐾')
        setStatus('success')
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
      backgroundColor: C.bowtie, padding: '80px 24px',
      backgroundImage: 'radial-gradient(600px 400px at 80% 50%, rgba(232,168,89,0.08), transparent 65%)',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>

        <FadeIn>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: 'rgba(232,168,89,0.8)', marginBottom: 16 }}>
            Early access
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em',
            color: C.white, margin: '0 0 14px' }}>
            Bertie sta{' '}
            <em style={{ fontStyle: 'italic', color: C.gold }}>arrivando.</em>
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)',
            margin: '0 0 36px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Entra in lista e ricevi l'accesso in anteprima.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          {status === 'success' ? (
            <div style={{
              backgroundColor: 'rgba(232,168,89,0.15)', borderRadius: 16,
              padding: '20px 24px', border: '1px solid rgba(232,168,89,0.3)',
            }}>
              <p style={{ color: C.gold, fontWeight: 600, fontSize: 15 }}>{msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="email"
                  placeholder="La tua email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    flex: '1 1 240px', maxWidth: 320,
                    padding: '14px 20px', borderRadius: 999,
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: C.white, fontSize: 14, outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <button type="submit" disabled={status === 'loading'}
                  style={{
                    padding: '14px 28px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                    backgroundColor: C.gold, color: C.white, border: 'none',
                    cursor: 'pointer', transition: 'background-color 0.2s',
                    flexShrink: 0, minWidth: 140,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = C.honey}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = C.gold}>
                  {status === 'loading'
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Entra in lista'
                  }
                </button>
              </div>
              {status === 'error' && (
                <p style={{ color: '#F0A0A0', fontSize: 13, marginTop: 10 }}>{msg}</p>
              )}
            </form>
          )}
        </FadeIn>

      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ backgroundColor: C.bowtie, borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '28px 24px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Ber</span>
            <em style={{ color: C.gold, fontStyle: 'italic' }}>tie</em>
          </span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
              Privacy Policy
            </a>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              © 2025 Bertie
            </span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, lineHeight: 1.5 }}>
          Bertie può ricevere commissioni sugli acquisti effettuati tramite i link presenti nell'app (programma Amazon Affiliates e partner selezionati). I prezzi e la disponibilità dei prodotti sono soggetti a variazioni.
        </p>
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
      <Features />
      <Pricing />
      <Waitlist />
      <Footer />
    </div>
  )
}
