import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { Plus, ChevronRight, Send, Syringe, MapPin, Camera, Bell, Shield, MessageCircle, LogOut, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import LuoghiView from './Luoghi'
import AppShell from '../components/AppShell'
import BottomNav from '../components/BottomNav'
import GoogleAd from '../components/GoogleAd'

// ─── Mock data ─────────────────────────────────────────────────────────────

// ─── Home / Salute ──────────────────────────────────────────────────────────
const GIORNI_IT = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato']
const MESI_IT   = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre']

// Consigli giornalieri in italiano — ruotano ogni giorno in base alla data
const CONSIGLI_IT = [
  "L'acqua fresca è fondamentale: cambia la ciotola almeno due volte al giorno, soprattutto d'estate.",
  "Un cane che mastica molto ha bisogno di stimoli mentali oltre che fisici — prova i giochi puzzle.",
  "Controlla le orecchie del tuo cane una volta a settimana: arrossamenti o cattivo odore possono indicare un'infezione.",
  "I cani anziani soffrono spesso di artrite — evita scale ripide e considera un tappetino antiscivolo.",
  "Il momento del pasto dovrebbe essere fisso ogni giorno: la routine riduce lo stress nel cane.",
  "Dopo ogni passeggiata in campagna controlla il pelo per zecche, soprattutto nelle zone calde come ascelle e orecchie.",
  "I denti del cane andrebbero spazzolati 2-3 volte a settimana — usa dentifricio specifico per cani.",
  "Non lasciare mai il cane in auto d'estate: bastano pochi minuti per un colpo di calore letale.",
  "Il contatto visivo durante il gioco rafforza il legame con il tuo cane e stimola la sua fiducia.",
  "I cani comunicano molto con la coda — una coda bassa e rigida indica tensione, non sempre paura.",
  "Anche un breve gioco di 10 minuti al giorno riduce lo stress e migliora l'umore del tuo cane.",
  "Le crocchette vanno conservate in contenitori ermetici per mantenere la freschezza e i nutrienti.",
  "Il pelo del cane va spazzolato regolarmente: riduce i peli in casa e previene i nodi.",
  "I cuccioli hanno bisogno di dormire fino a 18 ore al giorno — il sonno è essenziale per la crescita.",
  "Evita di dare ossa cotte al tuo cane: si spezzano in schegge pericolose. Preferisci quelle crude.",
  "La socializzazione precoce (0-4 mesi) è il periodo più importante per formare un cane equilibrato.",
  "Se il tuo cane ha paura dei tuoni, crea un angolo sicuro con la sua coperta preferita.",
  "Cioccolato, uva, cipolle e xilitolo sono tossici per i cani — tienili sempre fuori dalla loro portata.",
  "Passeggiare su percorsi nuovi stimola l'olfatto del cane tanto quanto una corsa più lunga.",
  "Le unghie troppo lunghe cambiano il modo in cui il cane cammina e possono causare dolore alle articolazioni.",
  "Un cane che abbaia troppo spesso è annoiato o ansioso — valuta di aumentare l'attività fisica.",
  "Il rinforzo positivo funziona meglio delle punizioni: premia sempre il comportamento che vuoi ripetere.",
  "I cani capiscono il tono della voce più che le parole — parla con calma nei momenti di stress.",
  "Dopo il bagno asciuga bene le orecchie del tuo cane: l'umidità è la causa principale delle otiti.",
  "I cani anziani hanno spesso bisogno di controlli dal veterinario ogni 6 mesi anziché annuali.",
  "L'erba che il cane mangia è spesso un modo naturale per aiutare la digestione — raramente è un problema.",
  "Un tappetino da leccatura (lick mat) con crema di arachidi o yogurt greco occupa il cane per minuti.",
  "La temperatura ideale per dormire del cane è tra 18 e 22°C — evita correnti d'aria dirette.",
  "I cani che vivono in appartamento beneficiano moltissimo di almeno 3 uscite al giorno.",
  "Introduci sempre i nuovi cibi gradualmente, mescolandoli con quello abituale per 7-10 giorni.",
  "Il contatto fisico — coccole e massaggi — abbassa il cortisolo sia nel cane che nel proprietario.",
]

// Hook: consiglio del giorno — seleziona dalla lista italiana in base alla data
function useDailyTip() {
  const [tip, setTip] = useState(null)

  useEffect(() => {
    const now     = new Date()
    const start   = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now - start) / 86400000)
    setTip(CONSIGLI_IT[dayOfYear % CONSIGLI_IT.length])
  }, [])

  return { tip, loading: false }
}

// ─── BottomDrawer — overlay tap + swipe-down + handle tap ──────────────────
function BottomDrawer({ open, onClose, children, style = {} }) {
  const touchStartY  = useRef(null)
  const panelRef     = useRef(null)

  if (!open) return null

  const handlePanelTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handlePanelTouchEnd = (e) => {
    if (touchStartY.current === null) return
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    const scrollTop = panelRef.current?.scrollTop ?? 0
    if (deltaY > 80 && scrollTop === 0) onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200,
      display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>

      {/* Overlay — tap to close */}
      <div
        style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.45)' }}
        onClick={onClose}
        onTouchEnd={(e) => { e.preventDefault(); onClose() }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        onTouchStart={handlePanelTouchStart}
        onTouchEnd={handlePanelTouchEnd}
        style={{
          position:'relative', backgroundColor:'#FFFFFF',
          borderRadius:'20px 20px 0 0', padding:'12px 20px 40px',
          maxHeight:'85vh', overflowY:'auto',
          ...style,
        }}>

        {/* Handle bar — tap to close */}
        <div
          onClick={onClose}
          onTouchEnd={(e) => { e.stopPropagation(); onClose() }}
          style={{
            width:36, height:5, borderRadius:999,
            backgroundColor:'#CDCDCD',
            margin:'0 auto 16px',
            cursor:'pointer',
          }}
        />

        {children}
      </div>
    </div>
  )
}

function SaluteView({ dogName, dogRazza, photoUrl, dogWeight, dogAge, dogSex, userName, dogId, onGoToLibretto }) {
  const [listaVaccini, setListaVaccini] = useState([])
  const [rinnovaTarget, setRinnovaTarget] = useState(null)
  const [nuovaData, setNuovaData]         = useState('')
  const [rinnovaSaving, setRinnovaSaving] = useState(false)

  useEffect(() => {
    if (!dogId) return
    const now = new Date()
    supabase.from('vaccines').select('*')
      .eq('dog_id', dogId).eq('type', 'vaccine')
      .order('next_date', { ascending: true })
      .then(({ data }) => {
        setListaVaccini((data || []).map(v => ({
          nome:    v.name,
          data:    v.date ? new Date(v.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          giorni:  v.next_date ? Math.round((new Date(v.next_date) - now) / 86400000) : null,
          scaduto: v.next_date ? new Date(v.next_date) < now : false,
        })))
      })
  }, [dogId])

  const handleRinnova = () => {
    if (!nuovaData) return
    setRinnovaSaving(true)
    setTimeout(() => {
      setListaVaccini(prev => prev.map(v =>
        v.nome === rinnovaTarget.nome
          ? { ...v, data: new Date(nuovaData).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
              scaduto: false, giorni: Math.round((new Date(nuovaData) - new Date()) / 86400000) }
          : v
      ))
      setRinnovaTarget(null)
      setNuovaData('')
      setRinnovaSaving(false)
    }, 400)
  }

  const scaduti = listaVaccini.filter(v => v.scaduto).length
  const { tip, loading: tipLoading } = useDailyTip()

  const now       = new Date()
  const dayLabel  = GIORNI_IT[now.getDay()].toUpperCase()
  const dateLabel = `${now.getDate()} ${MESI_IT[now.getMonth()].toUpperCase()}`
  const firstName = userName?.split(' ')[0] || dogName || 'amico'

  return (
    <div className="flex flex-col gap-4 pt-1 pb-4">

      {/* ── Data + Greeting ── */}
      <div>
        <p style={{ color: '#B77336', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          {dayLabel} · {dateLabel}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: '#2A2C2C', letterSpacing: '-0.025em', lineHeight: 1.05, margin: 0 }}>
          Ciao, <em>{firstName}</em>.
        </h2>
      </div>

      {/* ── Dog card (oro) ── */}
      <div className="rounded-card flex items-center gap-4 px-4 py-4"
        style={{ backgroundColor: '#E8A859', boxShadow: '0 8px 24px -8px rgba(232,168,89,.55)' }}>
        {/* Avatar */}
        <div className="shrink-0 w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center"
          style={{ border: '2.5px solid rgba(255,255,255,0.55)', backgroundColor: '#F6ECC8' }}>
          {photoUrl
            ? <img src={photoUrl} alt={dogName || 'cane'} className="w-full h-full object-cover" />
            : <img src="/bertie-logo.svg" alt="Bertie" className="w-full h-full object-contain" />
          }
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: '#FFFFFF', lineHeight: 1.1 }}>
            {dogName || 'Bertie'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 2 }}>
            {[
              dogRazza,
              dogAge,
              dogWeight ? `${dogWeight} kg` : null,
            ].filter(Boolean).join(' · ') || 'Aggiungi il profilo'}
          </p>
        </div>
      </div>


      {/* ── Consiglio del giorno ── */}
      <div className="rounded-card overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: '#FBF6E2' }}>
          <span className="text-xs font-bold" style={{ color: '#B77336' }}>
            🐾 Consiglio del giorno
          </span>
          {dogRazza && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill"
              style={{ backgroundColor: '#EFE0A8', color: '#B77336' }}>
              {dogRazza}
            </span>
          )}
        </div>
        <div className="px-4 py-4" style={{ borderTop: '1px solid #F6ECC8' }}>
          {tipLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#E8A859', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: '#A7A8A8' }}>Carico consiglio…</p>
            </div>
          ) : tip ? (
            <p className="text-sm leading-relaxed" style={{ color: '#464949' }}>{tip}</p>
          ) : (
            <p className="text-sm" style={{ color: '#A7A8A8' }}>Consiglio non disponibile al momento.</p>
          )}
        </div>
      </div>

      {/* ── Card unificata: vaccini + antipar + toelettatura ── */}
      <div className="rounded-card overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>

        {/* Vaccini */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: '#FBF6E2' }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#B77336' }}>
            <Syringe size={11} /> Vaccini
          </span>
          <button onClick={onGoToLibretto} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
            <Plus size={11} /> Aggiungi
          </button>
        </div>
        {listaVaccini.length === 0 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid #F6ECC8' }}>
            <p className="text-sm" style={{ color: '#A7A8A8' }}>Nessun vaccino registrato</p>
          </div>
        )}
        {listaVaccini.map((v) => (
          <div key={v.nome}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid #F6ECC8' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>{v.nome}</p>
              <p className="text-xs" style={{ color: '#A7A8A8' }}>{v.data}</p>
            </div>
            <div className="flex items-center gap-2">
              {v.scaduto && (
                <button
                  onClick={() => { setRinnovaTarget(v); setNuovaData('') }}
                  style={{ fontSize: 11, fontWeight: 600, color: '#C1121F',
                    textDecoration: 'underline', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0 }}>
                  Aggiorna
                </button>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-pill"
                style={{
                  backgroundColor: v.scaduto ? '#B77336' : v.giorni <= 60 ? '#F0B97A' : '#E8A859',
                  color: '#FFFFFF',
                }}>
                {v.scaduto ? 'Scaduto' : `${v.giorni} gg`}
              </span>
            </div>
          </div>
        ))}

        {/* Antiparassitari */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: '#FBF6E2', borderTop: '1px solid #F6ECC8' }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#B77336' }}>
            💊 Antiparassitari
          </span>
          <button onClick={onGoToLibretto} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
            <Plus size={11} /> Aggiungi
          </button>
        </div>
        <div className="px-4 py-3" style={{ borderTop: '1px solid #F6ECC8' }}>
          <p className="text-sm" style={{ color: '#A7A8A8' }}>Nessun trattamento registrato</p>
        </div>

        {/* Toelettatura */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: '#FBF6E2', borderTop: '1px solid #F6ECC8' }}>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#B77336' }}>
            🛁 Toelettatura
          </span>
          <button onClick={onGoToLibretto} className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
            <Plus size={11} /> Prenota
          </button>
        </div>
        <div className="px-4 py-3" style={{ borderTop: '1px solid #F6ECC8' }}>
          <p className="text-sm" style={{ color: '#A7A8A8' }}>Nessun appuntamento</p>
        </div>

      </div>

      {/* ── Drawer Aggiorna vaccino ── */}
      <BottomDrawer open={!!rinnovaTarget} onClose={() => { setRinnovaTarget(null); setNuovaData('') }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#2A2C2C', marginBottom: 4 }}>
          Aggiorna vaccino
        </p>
        <p style={{ fontSize: 13, color: '#6B6E6E', marginBottom: 20 }}>
          {rinnovaTarget?.nome}
        </p>

        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6E6E',
          display: 'block', marginBottom: 8 }}>
          Nuova data di scadenza
        </label>
        <input type="date"
          min={new Date().toISOString().split('T')[0]}
          value={nuovaData}
          onChange={e => setNuovaData(e.target.value)}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12,
            border: '1.5px solid #EFE0A8', backgroundColor: '#FBF6E2',
            fontSize: 15, color: '#2A2C2C', outline: 'none',
            marginBottom: 16, boxSizing: 'border-box',
          }} />

        <button onClick={handleRinnova} disabled={!nuovaData || rinnovaSaving}
          style={{
            width: '100%', padding: '14px', borderRadius: 999,
            backgroundColor: '#E8A859', color: '#FFFFFF',
            fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
            opacity: !nuovaData || rinnovaSaving ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {rinnovaSaving
            ? <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.7s linear infinite' }} />
            : 'Salva rinnovo'}
        </button>
      </BottomDrawer>

    </div>
  )
}

// ─── Sezione Mappa → delegata a LuoghiView ─────────────────────────────────
// (componente standalone in src/pages/Luoghi.jsx)


// ─── Sezione AI Vet ─────────────────────────────────────────────────────────
function AIVetView({ isSupporter }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Ciao! Sono il vet AI di Bertie 🐾 Descrivi i sintomi del tuo cane e ti aiuto a capire cosa fare.' },
  ])
  const [input, setInput] = useState('')
  const [count, setCount] = useState(0)

  const send = () => {
    if (!input.trim() || count >= 10) return
    setMsgs((m) => [...m,
      { role: 'user', text: input },
      { role: 'ai', text: 'Grazie. Ti consiglio di monitorare la situazione per 24 ore. Se i sintomi persistono, contatta il tuo veterinario di fiducia. Hai altri dettagli da aggiungere?' },
    ])
    setCount((c) => c + 1)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Counter */}
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#B77336',
          textTransform: 'uppercase', letterSpacing: '0.10em' }}>
          AI Veterinario
        </p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-pill"
          style={{ backgroundColor: count >= 10 ? '#FBF6E2' : '#F6ECC8',
            color: count >= 10 ? '#A7A8A8' : '#B77336' }}>
          {count}/10 domande
        </span>
      </div>

      {/* Chat messages */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mr-2 self-end"
                style={{ backgroundColor: '#F6ECC8' }}>
                <img src="/bertie-logo.svg" alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="max-w-[78%] px-4 py-3 text-sm leading-relaxed"
              style={m.role === 'user'
                ? { backgroundColor: '#2A2C2C', color: '#F6ECC8',
                    borderRadius: '18px 18px 4px 18px' }
                : { backgroundColor: '#FFFFFF', color: '#464949',
                    borderRadius: '18px 18px 18px 4px',
                    boxShadow: 'var(--shadow-soft)' }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={count >= 10 ? 'Limite mensile raggiunto' : 'Descrivi i sintomi…'}
          disabled={count >= 10}
          className="flex-1 px-4 py-3 text-sm outline-none disabled:opacity-50"
          style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1.5px solid #EFE0A8',
            color: '#2A2C2C', fontFamily: 'var(--font-sans)' }}
        />
        <button onClick={send} disabled={!input.trim() || count >= 10}
          className="w-12 h-12 flex items-center justify-center rounded-[14px] disabled:opacity-40 shrink-0"
          style={{ backgroundColor: '#E8A859' }}>
          <Send size={16} style={{ color: '#FFFFFF' }} />
        </button>
      </div>
    </div>
  )
}

// ─── Sezione Diario ─────────────────────────────────────────────────────────
const VACCINI_SUGGERITI = ['Polivalente DHPP','Rabbia','Leishmaniosi','Leptospirosi','Tosse del canile','Parvovirosi']
const ANTIPAR_TIPI      = ['Spot-on','Collare','Compressa','Spray']

function LibrettoView({ dogName, dogId }) {
  const [sezione, setSezione]   = useState('vaccini')
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [swipedId, setSwipedId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [showFoto, setShowFoto] = useState(false)
  const [fotoPreview, setFotoPreview] = useState(null)
  const fotoRef  = useRef(null)
  const touchX   = useRef({})

  // ── Form vaccino ──
  const emptyV = { nome:'', data:'', prossima:'', veterinario:'', note:'', nomeQ:'' }
  const [vForm, setVForm]         = useState(emptyV)
  const [showNomeDrop, setShowNomeDrop] = useState(false)
  const setV = (k,v) => setVForm(f=>({...f,[k]:v}))

  // ── Form antipar ──
  const emptyA = { tipo:'', tipoQ:'', prodotto:'', data:'', prossima:'', note:'' }
  const [aForm, setAForm]         = useState(emptyA)
  const [showTipoDrop, setShowTipoDrop] = useState(false)
  const setA = (k,v) => setAForm(f=>({...f,[k]:v}))

  const formatDate = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})
  }

  const getBadge = (nextDate) => {
    if (!nextDate) return null
    const days = Math.round((new Date(nextDate) - new Date()) / 86400000)
    if (days < 0)   return { label:'Scaduto',      color:'#C1121F', bg:'#FDECEA' }
    if (days <= 30) return { label:'In scadenza',  color:'#B77336', bg:'#FFF3CD' }
    return               { label:'In regola',    color:'#2E7D52', bg:'#F0FBF4' }
  }

  const calcNextAntipar = (tipo, data) => {
    if (!data) return ''
    const d = new Date(data)
    if (tipo === 'Collare') d.setMonth(d.getMonth() + 3)
    else d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  // ── Carica ──
  useEffect(() => {
    if (!dogId) return
    setLoading(true)
    const type = sezione === 'vaccini' ? 'vaccine' : 'antiparassitario'
    supabase.from('vaccines').select('*')
      .eq('dog_id', dogId).eq('type', type)
      .order('date', { ascending: false })
      .then(({ data }) => { setRecords(data || []); setLoading(false) })
  }, [dogId, sezione])

  // ── Salva vaccino ──
  const handleSaveVaccino = async () => {
    if (!vForm.nome || !vForm.data || !dogId) return
    setSaving(true)
    const { data, error } = await supabase.from('vaccines').insert({
      dog_id: dogId, name: vForm.nome, date: vForm.data,
      next_date: vForm.prossima || null, type: 'vaccine',
      veterinario: vForm.veterinario || null,
      notes: vForm.note || null, reminder_days: 30,
    }).select().single()
    if (!error && data) { setRecords(r => [data,...r]); setVForm(emptyV); setShowDrawer(false) }
    setSaving(false)
  }

  // ── Salva antipar ──
  const handleSaveAntipar = async () => {
    if (!aForm.tipo || !aForm.data || !dogId) return
    setSaving(true)
    const next = aForm.prossima || calcNextAntipar(aForm.tipo, aForm.data)
    const { data, error } = await supabase.from('vaccines').insert({
      dog_id: dogId, name: aForm.prodotto || aForm.tipo, date: aForm.data,
      next_date: next || null, type: 'antiparassitario',
      notes: [aForm.tipo, aForm.note].filter(Boolean).join(' · '),
      reminder_days: 30,
    }).select().single()
    if (!error && data) { setRecords(r => [data,...r]); setAForm(emptyA); setShowDrawer(false) }
    setSaving(false)
  }

  // ── Elimina ──
  const handleDelete = async (id) => {
    await supabase.from('vaccines').delete().eq('id', id)
    setRecords(r => r.filter(v => v.id !== id))
    setDeleteId(null); setSwipedId(null)
  }

  // ── Swipe ──
  const onTouchStart = (e, id) => { touchX.current[id] = e.touches[0].clientX }
  const onTouchEnd   = (e, id) => {
    const diff = (touchX.current[id] || 0) - e.changedTouches[0].clientX
    if (diff > 60) setSwipedId(id)
    else if (diff < -20) setSwipedId(null)
  }

  // ── Foto libretto ──
  const handleFotoCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
    if (dogId) {
      const ext  = file.name.split('.').pop()
      const path = `${dogId}/${Date.now()}.${ext}`
      supabase.storage.from('libretto-photos').upload(path, file, { upsert: false })
    }
  }

  const nomeFiltrati  = vForm.nomeQ ? VACCINI_SUGGERITI.filter(s => s.toLowerCase().includes(vForm.nomeQ.toLowerCase())) : VACCINI_SUGGERITI
  const tipoFiltrati  = aForm.tipoQ ? ANTIPAR_TIPI.filter(s => s.toLowerCase().includes(aForm.tipoQ.toLowerCase())) : ANTIPAR_TIPI

  const FieldLabel = ({ text, optional }) => (
    <p className="text-xs font-semibold mb-1.5" style={{ color:'#6B6E6E' }}>
      {text}{optional && <span style={{ fontWeight:400, color:'#A7A8A8' }}> (opzionale)</span>}
    </p>
  )
  const FieldInput = ({ type='text', placeholder, value, onChange, max }) => (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} max={max}
      className="w-full px-4 py-3 rounded-[12px] text-sm border-0 outline-none mb-3"
      style={{ backgroundColor:'#FBF6E2', color:'#2A2C2C' }} />
  )

  return (
    <div className="flex flex-col gap-4 pb-4">

      {/* Tabs */}
      <div className="flex gap-2">
        {[{id:'vaccini',label:'Vaccini'},{id:'antipar',label:'Antiparassitari'}].map(t => (
          <button key={t.id} onClick={() => { setSezione(t.id); setShowDrawer(false) }}
            className="flex-1 py-2 text-xs font-bold transition-colors"
            style={{ borderRadius:14,
              backgroundColor: sezione===t.id ? '#E8A859':'#FFFFFF',
              color: sezione===t.id ? '#FFFFFF':'#E8A859',
              boxShadow: sezione===t.id ? 'none':'var(--shadow-soft)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Azioni */}
      <div className="flex gap-2">
        <button onClick={() => { setShowDrawer(true); setShowFoto(false) }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-card text-sm font-bold"
          style={{ border:'1.5px dashed #E8A859', color:'#E8A859', backgroundColor:'transparent' }}>
          <Plus size={15} /> Aggiungi
        </button>
        {sezione === 'vaccini' && (
          <button onClick={() => { setShowFoto(true); setShowDrawer(false) }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-card text-sm font-bold"
            style={{ border:'1.5px dashed #B77336', color:'#B77336', backgroundColor:'transparent' }}>
            <Camera size={15} /> Scatta foto
          </button>
        )}
      </div>

      {/* Foto libretto */}
      {showFoto && sezione === 'vaccini' && (
        <div className="rounded-[18px] overflow-hidden"
          style={{ backgroundColor:'#FFFFFF', boxShadow:'var(--shadow-soft)' }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color:'#2A2C2C' }}>Fotografa il libretto</p>
            <button onClick={() => { setShowFoto(false); setFotoPreview(null) }}
              style={{ color:'#A7A8A8', fontSize:18, lineHeight:1, background:'none', border:'none', cursor:'pointer' }}>✕</button>
          </div>
          <div className="px-4 pb-4 flex flex-col gap-3">
            {!fotoPreview ? (
              <>
                <p className="text-xs" style={{ color:'#6B6E6E', lineHeight:1.5 }}>
                  Scatta una foto al libretto cartaceo — i vaccini saranno riconosciuti automaticamente.
                </p>
                <button onClick={() => fotoRef.current?.click()}
                  className="w-full py-10 rounded-[14px] flex flex-col items-center gap-2 active:opacity-70"
                  style={{ border:'2px dashed #EFE0A8', backgroundColor:'#FBF6E2', cursor:'pointer' }}>
                  <Camera size={28} style={{ color:'#B77336' }} />
                  <span className="text-sm font-semibold" style={{ color:'#B77336' }}>Tocca per scattare</span>
                  <span className="text-xs" style={{ color:'#A7A8A8' }}>o scegli dalla galleria</span>
                </button>
                <input ref={fotoRef} type="file" accept="image/*" capture="environment"
                  className="hidden" onChange={handleFotoCapture} />
              </>
            ) : (
              <>
                <img src={fotoPreview} alt="libretto" className="w-full rounded-[12px] object-cover" style={{ maxHeight:220 }} />
                <div className="rounded-[12px] px-3 py-2.5" style={{ backgroundColor:'#F0FBF4' }}>
                  <p className="text-xs font-semibold" style={{ color:'#2E7D52', lineHeight:1.4 }}>
                    Foto salvata! Il riconoscimento automatico sarà disponibile a breve.
                  </p>
                </div>
                <button onClick={() => setFotoPreview(null)} className="text-xs font-semibold text-center"
                  style={{ color:'#A7A8A8', background:'none', border:'none', cursor:'pointer' }}>
                  Scatta un'altra foto
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-card overflow-hidden" style={{ backgroundColor:'#FFFFFF', boxShadow:'var(--shadow-soft)' }}>
        {loading ? (
          <div className="px-4 py-6 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor:'#E8A859', borderTopColor:'transparent' }} />
            <p className="text-sm" style={{ color:'#A7A8A8' }}>Carico…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color:'#A7A8A8' }}>
              {sezione === 'vaccini' ? 'Nessun vaccino registrato' : 'Nessun trattamento registrato'}
            </p>
            <p className="text-xs mt-1" style={{ color:'#C0C0C0' }}>Tocca + Aggiungi per iniziare</p>
          </div>
        ) : records.map((v, i) => {
          const badge    = getBadge(v.next_date)
          const isOpen   = expanded === v.id
          const isSwiped = swipedId === v.id
          return (
            <div key={v.id} style={{ position:'relative', overflow:'hidden',
              borderBottom: i < records.length-1 ? '1px solid #F6ECC8' : 'none' }}>

              {/* Swipe delete bg */}
              <div style={{ position:'absolute', right:0, top:0, bottom:0, width:80,
                backgroundColor:'#C1121F', display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer' }}
                onClick={() => setDeleteId(v.id)}>
                <Trash2 size={18} style={{ color:'#FFFFFF' }} />
              </div>

              {/* Card row */}
              <div
                onTouchStart={e => onTouchStart(e, v.id)}
                onTouchEnd={e => onTouchEnd(e, v.id)}
                onClick={() => { setExpanded(isOpen ? null : v.id); setSwipedId(null) }}
                style={{ position:'relative', backgroundColor:'#FFFFFF',
                  transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                  transition:'transform 0.25s ease', cursor:'pointer', padding:'14px 16px' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color:'#2A2C2C' }}>{v.name}</p>
                    <p className="text-xs mt-0.5" style={{ color:'#A7A8A8' }}>{formatDate(v.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {badge && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-pill"
                        style={{ backgroundColor:badge.bg, color:badge.color }}>
                        {badge.label}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ color:'#A7A8A8',
                      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition:'transform 0.2s' }} />
                  </div>
                </div>

                {/* Dettagli espansi */}
                {isOpen && (
                  <div className="mt-3 pt-3 flex flex-col gap-1.5"
                    style={{ borderTop:'1px solid #F6ECC8' }}>
                    {v.next_date && (
                      <p className="text-xs" style={{ color:'#6B6E6E' }}>
                        Prossima dose: <span style={{ color:'#2A2C2C', fontWeight:600 }}>{formatDate(v.next_date)}</span>
                      </p>
                    )}
                    {v.veterinario && (
                      <p className="text-xs" style={{ color:'#6B6E6E' }}>
                        Veterinario: <span style={{ color:'#2A2C2C', fontWeight:600 }}>{v.veterinario}</span>
                      </p>
                    )}
                    {v.notes && (
                      <p className="text-xs" style={{ color:'#6B6E6E' }}>
                        Note: <span style={{ color:'#2A2C2C' }}>{v.notes}</span>
                      </p>
                    )}
                    <button onClick={e => { e.stopPropagation(); setDeleteId(v.id) }}
                      className="text-xs font-semibold mt-1 text-left"
                      style={{ color:'#C1121F', background:'none', border:'none', cursor:'pointer' }}>
                      Elimina
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog conferma elimina */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, zIndex:300,
          display:'flex', alignItems:'center', justifyContent:'center',
          backgroundColor:'rgba(0,0,0,0.4)' }}>
          <div style={{ backgroundColor:'#FFFFFF', borderRadius:20, padding:'24px 20px',
            width:'80%', maxWidth:320, textAlign:'center' }}>
            <p className="text-sm font-bold mb-2" style={{ color:'#2A2C2C' }}>Eliminare questo record?</p>
            <p className="text-xs mb-5" style={{ color:'#6B6E6E' }}>L'operazione non è reversibile.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-pill text-sm font-semibold"
                style={{ backgroundColor:'#F6ECC8', color:'#2A2C2C', border:'none', cursor:'pointer' }}>
                Annulla
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 rounded-pill text-sm font-semibold"
                style={{ backgroundColor:'#C1121F', color:'#FFFFFF', border:'none', cursor:'pointer' }}>
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer Aggiungi ── */}
      <BottomDrawer open={showDrawer} onClose={() => setShowDrawer(false)}>

            <p className="text-base font-bold mb-4" style={{ color:'#2A2C2C' }}>
              {sezione === 'vaccini' ? 'Nuova vaccinazione' : 'Nuovo trattamento'}
            </p>

            {/* ── FORM VACCINO ── */}
            {sezione === 'vaccini' && (
              <>
                <FieldLabel text="Nome vaccino" />
                <div style={{ position:'relative', marginBottom:12 }}>
                  <input type="text" placeholder="es. Polivalente DHPP"
                    value={vForm.nomeQ}
                    onChange={e => { setV('nomeQ', e.target.value); setV('nome', e.target.value); setShowNomeDrop(true) }}
                    onFocus={() => setShowNomeDrop(true)}
                    onBlur={() => setTimeout(() => setShowNomeDrop(false), 150)}
                    className="w-full px-4 py-3 rounded-[12px] text-sm border-0 outline-none"
                    style={{ backgroundColor:'#FBF6E2', color:'#2A2C2C' }} />
                  {showNomeDrop && nomeFiltrati.length > 0 && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:10,
                      backgroundColor:'#FFFFFF', borderRadius:12,
                      boxShadow:'0 4px 20px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                      {nomeFiltrati.map(s => (
                        <button key={s} onMouseDown={() => { setV('nome', s); setV('nomeQ', s); setShowNomeDrop(false) }}
                          className="w-full text-left px-4 py-3 text-sm"
                          style={{ color:'#2A2C2C', borderBottom:'1px solid #F6ECC8',
                            background:'none', cursor:'pointer' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <FieldLabel text="Data somministrazione" />
                <FieldInput type="date" value={vForm.data}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setV('data', e.target.value)} />

                <FieldLabel text="Prossima dose" optional />
                <FieldInput type="date" value={vForm.prossima}
                  onChange={e => setV('prossima', e.target.value)} />

                <FieldLabel text="Veterinario" optional />
                <FieldInput placeholder="es. Dr. Rossi" value={vForm.veterinario}
                  onChange={e => setV('veterinario', e.target.value)} />

                <FieldLabel text="Note" optional />
                <textarea placeholder="Note aggiuntive…"
                  value={vForm.note} onChange={e => setV('note', e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] text-sm border-0 outline-none resize-none mb-4"
                  style={{ backgroundColor:'#FBF6E2', color:'#2A2C2C', minHeight:72 }} />

                <button onClick={handleSaveVaccino}
                  disabled={!vForm.nome || !vForm.data || saving}
                  className="w-full py-4 rounded-pill text-sm font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor:'#E8A859', color:'#FFFFFF', border:'none', cursor:'pointer',
                    opacity: !vForm.nome || !vForm.data || saving ? 0.5 : 1 }}>
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Salvataggio…' : 'Salva vaccino'}
                </button>
              </>
            )}

            {/* ── FORM ANTIPAR ── */}
            {sezione === 'antipar' && (
              <>
                <FieldLabel text="Tipo trattamento" />
                <div style={{ position:'relative', marginBottom:12 }}>
                  <input type="text" placeholder="es. Spot-on"
                    value={aForm.tipoQ}
                    onChange={e => { setA('tipoQ', e.target.value); setA('tipo', e.target.value); setShowTipoDrop(true) }}
                    onFocus={() => setShowTipoDrop(true)}
                    onBlur={() => setTimeout(() => setShowTipoDrop(false), 150)}
                    className="w-full px-4 py-3 rounded-[12px] text-sm border-0 outline-none"
                    style={{ backgroundColor:'#FBF6E2', color:'#2A2C2C' }} />
                  {showTipoDrop && tipoFiltrati.length > 0 && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:10,
                      backgroundColor:'#FFFFFF', borderRadius:12,
                      boxShadow:'0 4px 20px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                      {tipoFiltrati.map(s => (
                        <button key={s} onMouseDown={() => {
                          setA('tipo', s); setA('tipoQ', s)
                          setA('prossima', calcNextAntipar(s, aForm.data))
                          setShowTipoDrop(false)
                        }}
                          className="w-full text-left px-4 py-3 text-sm"
                          style={{ color:'#2A2C2C', borderBottom:'1px solid #F6ECC8',
                            background:'none', cursor:'pointer' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <FieldLabel text="Prodotto usato" optional />
                <FieldInput placeholder="es. Frontline Combo" value={aForm.prodotto}
                  onChange={e => setA('prodotto', e.target.value)} />

                <FieldLabel text="Data trattamento" />
                <FieldInput type="date" value={aForm.data}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => {
                    setA('data', e.target.value)
                    if (aForm.tipo) setA('prossima', calcNextAntipar(aForm.tipo, e.target.value))
                  }} />

                <FieldLabel text="Prossimo trattamento" optional />
                {aForm.tipo && aForm.data && (
                  <p className="text-xs mb-1" style={{ color:'#B77336' }}>
                    Calcolato automaticamente: {formatDate(calcNextAntipar(aForm.tipo, aForm.data))}
                  </p>
                )}
                <FieldInput type="date" value={aForm.prossima}
                  onChange={e => setA('prossima', e.target.value)} />

                <FieldLabel text="Note" optional />
                <textarea placeholder="Note aggiuntive…"
                  value={aForm.note} onChange={e => setA('note', e.target.value)}
                  className="w-full px-4 py-3 rounded-[12px] text-sm border-0 outline-none resize-none mb-4"
                  style={{ backgroundColor:'#FBF6E2', color:'#2A2C2C', minHeight:72 }} />

                <button onClick={handleSaveAntipar}
                  disabled={!aForm.tipo || !aForm.data || saving}
                  className="w-full py-4 rounded-pill text-sm font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor:'#E8A859', color:'#FFFFFF', border:'none', cursor:'pointer',
                    opacity: !aForm.tipo || !aForm.data || saving ? 0.5 : 1 }}>
                  {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Salvataggio…' : 'Salva trattamento'}
                </button>
              </>
            )}
      </BottomDrawer>

    </div>
  )
}


// ─── Sezione Profilo ────────────────────────────────────────────────────────
// ─── Banner ads (solo non-supporter) ───────────────────────────────────────
const NAV_HEIGHT = 72

function SupporterBanner({ isSupporter, onUpgrade }) {
  if (isSupporter) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, zIndex: 40,
    }}>
      <div style={{
        height: 50, backgroundColor: '#F0E8C0',
        borderTop: '1px solid #E3D89A',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <span style={{ fontSize: 11, color: '#8C7040', fontWeight: 500, fontFamily: 'var(--font-sans)' }}>
          Spazio pubblicitario — brand pet partner
        </span>
        <button onClick={onUpgrade} style={{
          fontSize: 10, color: '#B37830', textDecoration: 'underline',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-sans)',
        }}>
          Diventa Supporter per rimuoverlo →
        </button>
      </div>
    </div>
  )
}

function ProfiloView({ navigate, user, isSupporter, supporterExpires, onUpgrade, onManage, onRestore,
                       upgrading, upgradeError, dogName, dogRazza,
                       photoUrl: initialPhotoUrl, onPhotoChange }) {
  const [photoUrl, setPhotoUrl]   = useState(initialPhotoUrl)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  // Sincronizza se il parent aggiorna la foto (es. dopo reload)
  useEffect(() => { setPhotoUrl(initialPhotoUrl) }, [initialPhotoUrl])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoUrl(ev.target.result)
    reader.readAsDataURL(file)
    if (!user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('dog-photos').upload(path, file, { upsert: true, contentType: file.type })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('dog-photos').getPublicUrl(path)
        setPhotoUrl(publicUrl)
        await supabase.from('dogs').update({ photo_url: publicUrl }).eq('user_id', user.id)
        onPhotoChange?.(publicUrl)  // aggiorna Dashboard DOPO che il DB è scritto
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-4">

      {/* ── Dog hero card ── */}
      <div style={{
        backgroundColor: '#E8A859', boxShadow: '0 8px 24px -8px rgba(232,168,89,.55)',
        borderRadius: 20, padding: '16px 20px',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', minHeight: 100,
      }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', right: -40, bottom: -40, width: 160, height: 160,
          backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Avatar — fisso a sinistra */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: 2 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
              border: '2.5px solid rgba(255,255,255,0.65)', backgroundColor: '#F6ECC8',
            }}
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl
              ? <img src={photoUrl} alt="foto cane" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <img src="/bertie-logo.svg" alt="Bertie" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: '#2A2C2C', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
            }}
          >
            {uploading
              ? <div style={{ width: 12, height: 12, border: '2px solid #F6ECC8',
                  borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <Camera size={11} style={{ color: '#F6ECC8' }} />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        {/* Nome + pill — centrati sull'intera card */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          zIndex: 1, pointerEvents: 'none',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22,
            color: '#FFFFFF', lineHeight: 1.1, margin: 0 }}>
            {dogName || 'Il mio cane'}
          </p>
          {dogRazza && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '2px 0 8px' }}>
              {dogRazza}
            </p>
          )}
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              fontSize: 12, fontWeight: 600, color: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.20)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            {dogName ? 'Modifica profilo' : '+ Aggiungi profilo'}
          </button>
        </div>
      </div>


      {/* ── Supporter card ── */}
      {isSupporter ? (
        /* Supporter attivo */
        <div style={{
          backgroundColor: '#E8A859', borderRadius: 20,
          padding: '20px 20px', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: -30, bottom: -30, width: 120, height: 120,
            borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              🎀
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>
                Sei un Supporter
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', margin: 0 }}>
                {supporterExpires
                  ? `Valido fino al ${new Date(supporterExpires).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Abbonamento attivo'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Card upgrade */
        <div style={{
          backgroundColor: '#464949', borderRadius: 20,
          padding: '28px 24px', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160,
            borderRadius: '50%', backgroundColor: 'rgba(232,168,89,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: -30, bottom: -30, width: 110, height: 110,
            borderRadius: '50%', backgroundColor: 'rgba(232,168,89,0.05)', pointerEvents: 'none' }} />
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'rgba(232,168,89,0.70)', marginBottom: 8,
            position: 'relative', textAlign: 'center',
          }}>
            Bertie Supporter
          </p>
          <p style={{ fontSize: 19, fontWeight: 700, color: '#FFFFFF', marginBottom: 4,
            position: 'relative', textAlign: 'center' }}>
            Supporta Bertie
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18,
            position: 'relative', textAlign: 'center' }}>
            €9,99/anno · meno di €1 al mese · zero pubblicità
          </p>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '0 0 20px',
            display: 'flex', flexDirection: 'column', gap: 8, position: 'relative',
            alignItems: 'center',
          }}>
            {['Zero pubblicità', 'Badge Supporter nel profilo', 'Accesso anticipato alle feature'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'rgba(255,255,255,0.80)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(232,168,89,0.85)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button onClick={onUpgrade} disabled={upgrading}
            style={{
              width: '100%', padding: '13px', borderRadius: 999, fontSize: 14,
              fontWeight: 700, cursor: upgrading ? 'not-allowed' : 'pointer',
              backgroundColor: '#E8A859', color: '#FFFFFF', border: 'none',
              opacity: upgrading ? 0.7 : 1, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {upgrading && (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.7s linear infinite' }} />
            )}
            {upgrading ? 'Attendere…' : 'Diventa Supporter — €9,99/anno'}
          </button>
          {upgradeError && (
            <p style={{ color: '#F0A0A0', fontSize: 12, marginTop: 8, textAlign: 'center', position: 'relative' }}>
              {upgradeError}
            </p>
          )}
          <button onClick={onRestore}
            style={{
              width: '100%', marginTop: 12, padding: '8px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.45)', position: 'relative',
            }}>
            Ripristina acquisti
          </button>
        </div>
      )}

      {/* ── Settings list ── */}
      <div className="rounded-[18px] overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
        {[
          {
            Icon: Bell, label: 'Notifiche', sub: 'Vaccini, antiparassitari, appuntamenti',
            color: '#B77336', bg: '#FBF6E2',
            action: () => navigate('/notifiche'),
          },
          {
            Icon: Shield, label: 'Privacy e dati', sub: 'I tuoi dati sono al sicuro',
            color: '#3A6EA8', bg: '#EEF4FB',
            action: () => window.open('https://philograna.github.io/Bertie/privacy.html', '_system'),
          },
          {
            Icon: MessageCircle, label: 'Feedback', sub: 'Aiutaci a migliorare Bertie',
            color: '#2E7D52', bg: '#F0FBF4',
            action: () => window.open('mailto:ciao@bertie.it', '_system'),
          },
          {
            Icon: LogOut, label: 'Esci', sub: null,
            color: '#B04040', bg: '#FBF0F0',
            action: async () => { await supabase.auth.signOut(); navigate('/') },
          },
        ].map((item, i, arr) => (
          <button key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 transition-opacity"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid #F6ECC8' : 'none' }}>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: item.bg }}>
              <item.Icon size={16} strokeWidth={1.8} style={{ color: item.color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: item.label === 'Esci' ? '#B04040' : '#2A2C2C' }}>
                {item.label}
              </p>
              {item.sub && <p className="text-xs" style={{ color: '#6B6E6E' }}>{item.sub}</p>}
            </div>
            <ChevronRight size={14} style={{ color: '#A7A8A8' }} />
          </button>
        ))}
      </div>

      {/* ── Footer ── */}
      <p className="text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
        color: '#A7A8A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Bertie · v0.2
      </p>
    </div>
  )
}

// ─── Sezione Accessori ──────────────────────────────────────────────────────
// ─── Shop — Amazon affiliate ────────────────────────────────────────────────
const AMAZON_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'bertie-21'

const CATEGORIE_ACC = [
  { id: 'tutti',         label: 'Tutti' },
  { id: 'alimentazione', label: '🥩 Cibo' },
  { id: 'passeggiata',   label: '🦮 Passeggiata' },
  { id: 'gioco',         label: '🎾 Gioco' },
  { id: 'casa',          label: '🏠 Casa' },
  { id: 'salute',        label: '💊 Salute' },
  { id: 'igiene',        label: '🛁 Igiene' },
]

function getAmazonLink(name, brand) {
  const query = encodeURIComponent(`${brand ? brand + ' ' : ''}${name}`)
  return `https://www.amazon.it/s?k=${query}&tag=${AMAZON_TAG}`
}

const CAT_BG = {
  alimentazione: '#FFF3E6',
  passeggiata:   '#E6F4F0',
  gioco:         '#FFFBE6',
  casa:          '#EEE6FF',
  salute:        '#E8F8E8',
  igiene:        '#E6EEFF',
}


// Card compatta — solo testo, nessuna immagine (v1 pre-PA API)
function ProdCard({ p, liked, onLike, width }) {
  const bg = CAT_BG[p.category] || '#FBF6E2'

  return (
    <a
      href={getAmazonLink(p.name, p.brand)}
      target="_blank" rel="noopener noreferrer"
      className="flex flex-col rounded-[16px] overflow-hidden active:opacity-70 transition-opacity"
      style={{ ...(width ? { width, flexShrink: 0 } : {}), backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)', textDecoration: 'none' }}
    >
      {/* Header colorato con badge categoria + like */}
      <div style={{ height: 56, backgroundColor: bg, position: 'relative',
        display: 'flex', alignItems: 'flex-end', padding: '0 10px 8px' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#B77336',
          textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
          {p.category}
        </span>
        <button
          onClick={e => { e.preventDefault(); onLike() }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24"
            fill={liked ? '#E8A859' : 'none'}
            stroke={liked ? '#E8A859' : '#B77336'} strokeWidth="2.5">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
          </svg>
        </button>
      </div>

      {/* Testo — altezza fissa per allineamento prezzi nella griglia */}
      <div style={{ padding: '10px 10px 10px', display: 'flex', flexDirection: 'column',
        height: 110, boxSizing: 'border-box' }}>
        <p style={{ fontSize: 9, color: '#B77336', textTransform: 'uppercase',
          letterSpacing: '0.08em', fontFamily: 'monospace', fontWeight: 700, marginBottom: 3 }}>
          {p.brand || ''}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#2A2C2C', lineHeight: 1.25,
          flexGrow: 1, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {p.name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #F6ECC8', paddingTop: 6, marginTop: 'auto' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2A2C2C' }}>
            {p.price_label || '—'}
          </span>
          <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#E8A859',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </div>
        </div>
      </div>
    </a>
  )
}

function SkeletonProd() {
  return (
    <div className="flex flex-col rounded-[16px] overflow-hidden"
      style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
      <div className="animate-pulse" style={{ height: 56, backgroundColor: '#F0EAD6' }} />
      <div className="p-2.5 flex flex-col gap-1.5">
        <div className="h-2 rounded-full animate-pulse w-1/2" style={{ backgroundColor: '#F6ECC8' }} />
        <div className="h-3 rounded-full animate-pulse w-full" style={{ backgroundColor: '#F0EAD6' }} />
        <div className="h-3 rounded-full animate-pulse w-3/4" style={{ backgroundColor: '#F0EAD6' }} />
        <div className="h-4 rounded-full animate-pulse w-1/3 mt-1" style={{ backgroundColor: '#F6ECC8' }} />
      </div>
    </div>
  )
}


function AccessoriView({ dogName, dogRazza, dogWeight, dogAge }) {
  const [catFiltro, setCatFiltro] = useState('tutti')
  const [search, setSearch]       = useState('')
  const [liked, setLiked]         = useState({})
  const [prodotti, setProdotti]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('category')
      .then(({ data }) => { setProdotti(data || []); setLoading(false) })
  }, [])

  const visibili = prodotti.filter(p => {
    const catOk    = catFiltro === 'tutti' || p.category === catFiltro
    const searchOk = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return catOk && searchOk
  })

  return (
    <div className="flex flex-col gap-0 -mx-4">

      {/* Search */}
      <div className="mx-4 mb-3 px-3 py-2.5 rounded-[14px] flex items-center gap-2.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(70,73,73,0.08)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6E6E" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca crocchette, pettorine, snack…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#2A2C2C', fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {/* Filtri */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIE_ACC.map(c => (
          <button key={c.id} onClick={() => setCatFiltro(c.id)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-pill transition-colors"
            style={catFiltro === c.id
              ? { backgroundColor: '#2A2C2C', color: '#F6ECC8', border: '1px solid #2A2C2C' }
              : { backgroundColor: 'rgba(255,255,255,0.6)', color: '#464949', border: '1px solid rgba(70,73,73,0.08)' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Griglia 2 colonne — stesso stile del feed */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-2">
        {loading ? (
          [1,2,3,4,5,6].map(i => <SkeletonProd key={i} />)
        ) : visibili.map(p => (
          <ProdCard key={p.id} p={p}
            liked={!!liked[p.id]}
            onLike={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))} />
        ))}
      </div>

      {!loading && visibili.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2 mx-4">
          <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>Nessun prodotto trovato</p>
        </div>
      )}

      {/* Disclaimer affiliazione */}
      <div className="mx-4 mb-4 mt-2 px-3 py-2.5 rounded-[12px]"
        style={{ border: '1px dashed rgba(70,73,73,0.18)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
        <p style={{ fontSize: 9, color: '#6B6E6E', lineHeight: 1.4, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
          Bertie partecipa al Programma Affiliazione Amazon. I prezzi possono variare. Il prezzo per te non cambia.
        </p>
      </div>

    </div>
  )
}

// ─── Layout principale ──────────────────────────────────────────────────────
// Titoli in stile handoff: Instrument Serif 26px, parte finale in corsivo oro
const PAGE_TITLES = {
  mappa:     { pre: 'Luo',    post: 'ghi'  },
  aivet:     { pre: 'AI ',    post: 'Vet'  },
  diario:    { pre: 'Libret', post: 'to'   },
  accessori: { pre: 'Acces',  post: 'sori' },
  profilo:   { pre: 'Profi',  post: 'lo'   },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab]               = useState('vaccini')
  const [isSupporter, setIsSupporter]           = useState(false)
  const [bannerHeight, setBannerHeight]         = useState(0)
  const [supporterExpires, setSupporterExpires] = useState(null)
  const [userCity, setUserCity]                 = useState('')
  const [upgrading, setUpgrading]           = useState(false)
  const [upgradeError, setUpgradeError]     = useState('')
  const [showSuccess, setShowSuccess]   = useState(false)
  const [user, setUser]             = useState(null)
  const [dogName, setDogName]         = useState(null)
  const [dogRazza, setDogRazza]       = useState(null)
  const [dogPhotoUrl, setDogPhotoUrl] = useState(null)
  const [dogWeight, setDogWeight]     = useState(null)
  const [dogAge, setDogAge]           = useState(null)
  const [dogSex, setDogSex]           = useState(null)
  const [dogId, setDogId]             = useState(null)
  const [userName, setUserName]       = useState(null)

  // Carica utente + stato premium + profilo cane
  const loadUser = async () => {
    const { data } = await supabase.auth.getUser()
    const u = data?.user ?? null
    setUser(u)
    if (!u) return
    // Deriva nome dall'auth metadata (Google OAuth, email, ecc.)
    const meta = u.user_metadata || {}
    const name = meta.full_name || meta.name || u.email?.split('@')[0] || null
    setUserName(name)
    const [{ data: profile }, { data: dog }] = await Promise.all([
      supabase.from('profiles').select('city').eq('id', u.id).maybeSingle(),
      supabase.from('dogs').select('name, breed, photo_url, weight, age_label, sex').eq('user_id', u.id).maybeSingle(),
    ])
    if (profile) setUserCity(profile.city || '')
    if (dog) {
      setDogId(dog.id)
      setDogName(dog.name)
      setDogRazza(dog.breed)
      setDogPhotoUrl(dog.photo_url || null)
      setDogWeight(dog.weight || null)
      setDogAge(dog.age_label || null)
      setDogSex(dog.sex || null)
    }
    // Controlla entitlement RevenueCat (solo su native)
    if (Capacitor.isNativePlatform()) {
      try {
        await Purchases.logIn({ appUserID: u.id })
        const { customerInfo } = await Purchases.getCustomerInfo()
        const entitlement = customerInfo.entitlements.active['Bertie Pro']
        setIsSupporter(!!entitlement)
        setSupporterExpires(entitlement?.expirationDate ?? null)
      } catch {
        // RevenueCat non disponibile: fallback non-supporter
      }
    }
  }

  // Carica al mount
  useEffect(() => { loadUser() }, [])

  // Banner AdMob — visibile solo per i non-supporter
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    if (isSupporter) {
      AdMob.removeBanner().catch(() => {})
      setBannerHeight(0)
      return
    }
    let sizeListener
    const showAd = async () => {
      sizeListener = await AdMob.addListener(
        BannerAdPluginEvents.SizeChanged,
        ({ height }) => setBannerHeight(height ?? 50),
      )
      await AdMob.showBanner({
        adId: 'ca-app-pub-4785642866740799/4282832264',
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 83,
        isTesting: import.meta.env.DEV,
      })
    }
    showAd()
    return () => {
      sizeListener?.remove()
      AdMob.removeBanner()
    }
  }, [isSupporter])

  // Ricarica ogni volta che la pagina torna visibile (es. ritorno dall'onboarding)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadUser() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Acquisto abbonamento tramite Apple IAP (RevenueCat)
  const handleUpgrade = async () => {
    if (!user || !Capacitor.isNativePlatform()) return
    setUpgrading(true)
    setUpgradeError('')
    try {
      const { offerings } = await Purchases.getOfferings()
      const pkgs = offerings.current?.availablePackages ?? []
      const pkg = pkgs.find(p => p.packageType === 'ANNUAL') ?? pkgs[0]
      if (!pkg) throw new Error('Prodotto non disponibile')
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      const entitlement = customerInfo.entitlements.active['Bertie Pro']
      if (entitlement) {
        setIsSupporter(true)
        setSupporterExpires(entitlement.expirationDate ?? null)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
      }
    } catch (err) {
      if (!err.userCancelled) {
        setUpgradeError(err.message || 'Errore durante l\'acquisto')
      }
    } finally {
      setUpgrading(false)
    }
  }

  // Ripristina acquisti precedenti (richiesto da Apple)
  const handleRestorePurchases = async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      const { customerInfo } = await Purchases.restorePurchases()
      const entitlement = customerInfo.entitlements.active['Bertie Pro']
      setIsSupporter(!!entitlement)
      setSupporterExpires(entitlement?.expirationDate ?? null)
      if (entitlement) {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 5000)
      }
    } catch (err) {
      console.error('Ripristino acquisti:', err.message)
    }
  }

  // Gestione abbonamento Apple (Impostazioni → ID Apple → Abbonamenti)
  const handleManageSubscription = async () => {
    await Browser.open({ url: 'https://apps.apple.com/account/subscriptions' })
  }

  return (
    <AppShell>
      {/* Toast successo upgrade */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-btn text-sm font-semibold shadow-lg"
          style={{ backgroundColor: '#E8A859', color: '#FFFFFF', maxWidth: 360 }}>
          Benvenuto nel club Supporter!
        </div>
      )}

      {/* Top bar */}
      {tab === 'vaccini' ? (
        /* Home tab — solo safe-area, niente header visibile */
        <div className="shrink-0 pt-safe" style={{ backgroundColor: '#F6ECC8' }} />
      ) : (
        /* Altre tab — top bar stile handoff: solo titolo serif */
        <header className="flex items-center px-5 pt-safe pb-3 shrink-0"
          style={{ backgroundColor: '#F6ECC8' }}>
          {PAGE_TITLES[tab] && (
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: '#2A2C2C',
              margin: 0,
              lineHeight: 1,
            }}>
              {PAGE_TITLES[tab].pre}
              <em style={{ fontStyle: 'italic', color: '#D28C45' }}>
                {PAGE_TITLES[tab].post}
              </em>
            </h1>
          )}
        </header>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: `calc(160px + ${bannerHeight}px + env(safe-area-inset-bottom))` }}>
        {tab === 'vaccini'   && <SaluteView dogName={dogName} dogRazza={dogRazza} photoUrl={dogPhotoUrl} dogWeight={dogWeight} dogAge={dogAge} dogSex={dogSex} userName={userName} dogId={dogId} onGoToLibretto={() => setTab('diario')} />}
        {tab === 'mappa'     && <LuoghiView city={userCity} />}
        {tab === 'aivet'     && <AIVetView isSupporter={isSupporter} />}
        {tab === 'diario'    && <LibrettoView dogName={dogName} dogId={dogId} />}
        {tab === 'accessori' && <AccessoriView dogName={dogName} dogRazza={dogRazza} dogWeight={dogWeight} dogAge={dogAge} />}
        {tab === 'profilo'   && (
          <ProfiloView
            navigate={navigate}
            user={user}
            isSupporter={isSupporter}
            supporterExpires={supporterExpires}
            onUpgrade={handleUpgrade}
            onManage={handleManageSubscription}
            onRestore={handleRestorePurchases}
            upgrading={upgrading}
            upgradeError={upgradeError}
            dogName={dogName}
            dogRazza={dogRazza}
            photoUrl={dogPhotoUrl}
            onPhotoChange={(url) => setDogPhotoUrl(url)}
          />
        )}
      </div>

      <BottomNav
        active={tab}
        onChange={(t) => setTab(t)}
        isPremium={true}
        notifiche={0}
        bannerOffset={0}
      />
    </AppShell>
  )
}
