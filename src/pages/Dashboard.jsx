import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ChevronRight, Send, Lock, Syringe, MapPin, BookOpen, Dog, Camera, Bell, Shield, MessageCircle, LogOut, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import BottomNav from '../components/BottomNav'
import GoogleAd from '../components/GoogleAd'

// Fix leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Mock data ─────────────────────────────────────────────────────────────
const vaccini = [
  { nome: 'Polivalente DHPP', data: '12 Giu 2025', giorni: 38, scaduto: false },
  { nome: 'Rabbia',           data: '03 Mar 2025', giorni: -63, scaduto: true },
  { nome: 'Leishmaniosi',     data: '20 Ago 2025', giorni: 107, scaduto: false },
]


// Cronologia vaccini (storico somministrazioni)
const storicoVaccini = [
  { data: '12 Giu 2024', nome: 'Polivalente DHPP',  lotto: 'A4521X', veterinario: 'Dr. Rossi', prossima: '12 Giu 2025' },
  { data: '03 Mar 2024', nome: 'Rabbia',             lotto: 'R8812B', veterinario: 'Dr. Rossi', prossima: '03 Mar 2025' },
  { data: '20 Ago 2024', nome: 'Leishmaniosi',       lotto: 'L2290C', veterinario: 'Dr. Bianchi', prossima: '20 Ago 2025' },
  { data: '15 Gen 2024', nome: 'Polivalente DHPP',  lotto: 'A3310Y', veterinario: 'Dr. Rossi', prossima: '12 Giu 2024' },
]

// Cronologia antiparassitari
const storicoAntipar = [
  { data: '01 Apr 2025', prodotto: 'Frontline Combo L',   tipo: 'Spot-on',   note: 'Applicato tra le scapole' },
  { data: '01 Gen 2025', prodotto: 'Advantix 25–40 kg',   tipo: 'Spot-on',   note: '' },
  { data: '01 Ott 2024', prodotto: 'Frontline Combo L',   tipo: 'Spot-on',   note: 'Applicato tra le scapole' },
  { data: '01 Lug 2024', prodotto: 'NexGard Spectra XL',  tipo: 'Compresse', note: 'Somministrato con il pasto' },
]

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

function SaluteView({ dogName, dogRazza, photoUrl, dogWeight, dogAge, dogSex, userName }) {
  const [listaVaccini, setListaVaccini] = useState(vaccini)
  const [rinnovaTarget, setRinnovaTarget] = useState(null) // vaccino da rinnovare
  const [nuovaData, setNuovaData]         = useState('')
  const [rinnovaSaving, setRinnovaSaving] = useState(false)

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
          <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
            <Plus size={11} /> Aggiungi
          </button>
        </div>
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
          <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
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
            ✂️ Toelettatura
          </span>
          <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E8A859' }}>
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

// ─── Sezione Mappa ──────────────────────────────────────────────────────────
const MAX_KM = 1.5
const PAGE = 6

const FILTRI = [
  { id: 'tutti',        label: 'Tutti' },
  { id: 'parco',        label: '🌳 Parchi' },
  { id: 'spiaggia',     label: '🏖️ Spiagge' },
  { id: 'veterinario',  label: '🩺 Veterinari' },
  { id: 'toelettatore', label: '✂️ Toelettatori' },
  { id: 'ristorante',   label: '🍽️ Ristoranti' },
  { id: 'bar',          label: '☕ Bar' },
]

// Endpoint Overpass con fallback automatico
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function fetchOverpass(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 12000)
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch {
      // prova il prossimo endpoint
    }
  }
  return { elements: [] }
}

function buildOverpassQuery(lat, lng, r) {
  // Solo nodi (node) — le way non restituiscono lat/lon con out body
  return `[out:json][timeout:10];
(
  node[leisure=dog_park](around:${r},${lat},${lng});
  node[leisure=park](around:${r},${lat},${lng});
  node[leisure=beach][dog~"^(yes|leashed)$"](around:${r},${lat},${lng});
  node[natural=beach][dog~"^(yes|leashed)$"](around:${r},${lat},${lng});
  node[amenity=veterinary](around:${r},${lat},${lng});
  node[amenity=groomer](around:${r},${lat},${lng});
  node[shop=pet_grooming](around:${r},${lat},${lng});
  node[amenity=restaurant][dog~"^(yes|leashed)$"](around:${r},${lat},${lng});
  node[amenity=restaurant][outdoor_seating=yes](around:${r},${lat},${lng});
  node[amenity=bar][dog~"^(yes|leashed)$"](around:${r},${lat},${lng});
  node[amenity=bar][outdoor_seating=yes](around:${r},${lat},${lng});
  node[amenity=cafe][dog~"^(yes|leashed)$"](around:${r},${lat},${lng});
  node[amenity=cafe][outdoor_seating=yes](around:${r},${lat},${lng});
);
out body;`
}

function classifyElement(tags) {
  if (tags.leisure === 'dog_park' || tags.leisure === 'park')             return { tipo: 'parco',        emoji: '🌳' }
  if (tags.leisure === 'beach'    || tags.natural === 'beach')            return { tipo: 'spiaggia',     emoji: '🏖️' }
  if (tags.amenity === 'veterinary')                                      return { tipo: 'veterinario',  emoji: '🩺' }
  if (tags.amenity === 'groomer'  || tags.shop === 'pet_grooming')        return { tipo: 'toelettatore', emoji: '✂️' }
  if (tags.amenity === 'restaurant')                                      return { tipo: 'ristorante',   emoji: '🍽️' }
  if (tags.amenity === 'bar'      || tags.amenity === 'cafe')             return { tipo: 'bar',          emoji: '☕' }
  return null
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function RecenterMap({ pos }) {
  const map = useMap()
  useEffect(() => { if (pos) map.setView([pos.lat, pos.lng], 15) }, [pos, map])
  return null
}

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#0067e5;border:3px solid #fff;box-shadow:0 0 0 2px #0067e5"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function MappaView() {
  const [filtro, setFiltro]   = useState('tutti')
  const [userPos, setUserPos] = useState(null)
  const [geoError, setGeoError] = useState(false)
  const [luoghi, setLuoghi]   = useState([])
  const [loading, setLoading] = useState(false)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPos({ lat: coords.latitude, lng: coords.longitude }),
      () => setGeoError(true),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    if (!userPos) return
    setLoading(true)
    const { lat, lng } = userPos
    const query = buildOverpassQuery(lat, lng, MAX_KM * 1000)
    fetchOverpass(query)
      .then(data => {
        const seen = new Set()
        const results = []
        ;(data.elements || []).forEach(el => {
          const key = `${el.id}`
          if (seen.has(key)) return
          seen.add(key)
          const nome = el.tags?.name
          if (!nome) return
          const elLat = el.lat ?? el.center?.lat
          const elLng = el.lon ?? el.center?.lon
          if (!elLat || !elLng) return
          const km = haversineKm(lat, lng, elLat, elLng)
          if (km > MAX_KM) return
          const cat = classifyElement(el.tags || {})
          if (!cat) return
          results.push({
            id: key,
            tipo: cat.tipo,
            emoji: cat.emoji,
            nome,
            indirizzo: el.tags?.['addr:street']
              ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim()
              : '',
            km,
            lat: elLat,
            lng: elLng,
          })
        })
        setLuoghi(results.sort((a, b) => a.km - b.km))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userPos])

  useEffect(() => { setPagina(1) }, [filtro])

  const visibili = luoghi.filter(l => filtro === 'tutti' || l.tipo === filtro)
  const visibiliPaginati = visibili.slice(0, pagina * PAGE)
  const hasMore = visibiliPaginati.length < visibili.length

  const defaultCenter = [41.9028, 12.4964]

  return (
    <div className="flex flex-col gap-3">

      {/* ── Mappa ── */}
      {!userPos && !geoError ? (
        <div className="h-48 rounded-[20px] flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: '#EFE0A8' }}>
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#B77336', borderTopColor: 'transparent' }} />
          <p className="text-xs font-medium" style={{ color: '#8C5524' }}>Rilevando posizione…</p>
        </div>
      ) : (
        <div style={{ height: 210, borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 12px 28px -18px rgba(140,85,36,.28)' }}>
          <MapContainer
            center={userPos ? [userPos.lat, userPos.lng] : defaultCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userPos && <RecenterMap pos={userPos} />}
            {userPos && <Marker position={[userPos.lat, userPos.lng]} icon={userIcon} />}
            {visibili.map(l => (
              <Marker key={l.id} position={[l.lat, l.lng]}>
                <Popup>{l.emoji} <strong>{l.nome}</strong><br />{l.km.toFixed(2)} km</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {geoError && (
        <p className="text-xs font-medium px-1" style={{ color: '#6B6E6E' }}>
          📍 Posizione non disponibile — attiva la geolocalizzazione
        </p>
      )}

      {/* ── Chip filtri ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTRI.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-pill transition-colors"
            style={filtro === f.id
              ? { backgroundColor: '#2A2C2C', color: '#F6ECC8', border: '1px solid #2A2C2C' }
              : { backgroundColor: 'rgba(255,255,255,0.7)', color: '#464949', border: '1px solid rgba(70,73,73,0.10)' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#E8A859', borderTopColor: 'transparent' }} />
          <p className="text-xs font-medium" style={{ color: '#6B6E6E' }}>
            Cerco luoghi nelle vicinanze…
          </p>
        </div>
      )}

      {/* ── Lista risultati ── */}
      {!loading && (
        <div className="flex flex-col gap-2">
          {visibili.length === 0 && userPos && (
            <div className="flex flex-col items-center py-10 gap-2">
              <span style={{ fontSize: 36 }}>🐾</span>
              <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>Nessun luogo trovato</p>
              <p className="text-xs" style={{ color: '#6B6E6E' }}>Entro {MAX_KM} km · prova un'altra categoria</p>
            </div>
          )}
          {visibiliPaginati.map(l => (
            <div key={l.id}
              className="flex items-center justify-between px-4 py-3.5 rounded-[16px]"
              style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#FBF6E2', fontSize: 20 }}>
                  {l.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>{l.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B6E6E' }}>
                    {l.indirizzo ? `${l.indirizzo} · ` : ''}{l.km.toFixed(2)} km
                  </p>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: '#A7A8A8' }} />
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setPagina(p => p + 1)}
              className="w-full py-3 rounded-[16px] text-xs font-semibold"
              style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: '#6B6E6E',
                border: '1px dashed rgba(70,73,73,0.18)' }}
            >
              Mostra altri ({visibili.length - visibiliPaginati.length} rimasti)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sezione AI Vet ─────────────────────────────────────────────────────────
function AIVetView({ isSupporter }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Ciao! Sono il vet AI di Bertie 🐾 Descrivi i sintomi del tuo cane e ti aiuto a capire cosa fare.' },
  ])
  const [input, setInput] = useState('')
  const [count, setCount] = useState(0)

  if (!isSupporter) {
    return (
      <div className="flex flex-col gap-5 pb-4">

        {/* Hero gate */}
        <div className="rounded-[22px] p-6 flex flex-col items-center gap-4 text-center relative overflow-hidden"
          style={{ backgroundColor: '#2A2C2C' }}>
          {/* decorative circle */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180,
            backgroundColor: 'rgba(232,168,89,0.10)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(232,168,89,0.15)' }}>
            <Lock size={28} style={{ color: '#E8A859' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#E8A859',
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Premium · €0,99/mese
            </p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#FFFFFF',
              letterSpacing: '-0.015em', lineHeight: 1.1, margin: '0 0 8px' }}>
              AI <em>Veterinario</em>
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              Descrivi i sintomi del tuo cane e ricevi una valutazione immediata.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="rounded-[18px] overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
          {[
            { icon: '🩺', label: 'AI Veterinario', sub: '10 domande al mese' },
            { icon: '✂️', label: 'Prenota groomer', sub: 'Dog sitter e toelettatori vicino a te' },
            { icon: '🛂', label: 'Passaporto EU',   sub: 'Digitale, per viaggiare con il tuo cane' },
            { icon: '🐾', label: 'Community locale',sub: 'Passeggiate di gruppo e amici a 4 zampe' },
            { icon: '🐶', label: 'Animali illimitati', sub: 'Aggiungi tutti i tuoi cani' },
          ].map((f, i, arr) => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F6ECC8' : 'none' }}>
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-base"
                style={{ backgroundColor: '#FBF6E2' }}>{f.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>{f.label}</p>
                <p className="text-xs" style={{ color: '#6B6E6E' }}>{f.sub}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8A859" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="w-full py-4 rounded-pill font-semibold text-sm"
          style={{ backgroundColor: '#E8A859', color: '#FFFFFF',
            boxShadow: '0 8px 20px -6px rgba(232,168,89,0.55)' }}>
          ⭐ Attiva Premium — €0,99/mese
        </button>
        <p className="text-center text-xs" style={{ color: '#A7A8A8', marginTop: -8 }}>
          Annulla in qualsiasi momento
        </p>

      </div>
    )
  }

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
      position: 'fixed', bottom: NAV_HEIGHT, left: '50%',
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

function ProfiloView({ navigate, user, isSupporter, supporterExpires, onUpgrade, onManage,
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
      <div className="rounded-[22px] px-5 py-6 flex flex-col items-center gap-4 relative overflow-hidden"
        style={{ backgroundColor: '#E8A859', boxShadow: '0 12px 32px -12px rgba(232,168,89,.6)' }}>
        {/* bg circle decoration */}
        <div style={{ position: 'absolute', right: -50, bottom: -50, width: 200, height: 200,
          backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Avatar */}
        <div className="relative">
          <div
            className="w-[88px] h-[88px] rounded-full overflow-hidden cursor-pointer shrink-0"
            style={{ border: '3px solid rgba(255,255,255,0.6)', backgroundColor: '#F6ECC8' }}
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl
              ? <img src={photoUrl} alt="foto cane" className="w-full h-full object-cover" />
              : <img src="/bertie-logo.svg" alt="Bertie" className="w-full h-full object-contain" />
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#2A2C2C', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          >
            {uploading
              ? <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#F6ECC8', borderTopColor: 'transparent' }} />
              : <Camera size={13} style={{ color: '#F6ECC8' }} />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="text-center relative z-10">
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26,
            color: '#FFFFFF', lineHeight: 1.1, marginBottom: 4 }}>
            {dogName || 'Il mio cane'}
          </p>
          {dogRazza && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)' }}>{dogRazza}</p>
          )}
        </div>

        <button
          onClick={() => navigate('/onboarding')}
          className="px-5 py-2.5 text-sm font-semibold relative z-10"
          style={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999 }}
        >
          {dogName ? 'Modifica profilo' : '+ Aggiungi profilo'}
        </button>
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
            <button onClick={onManage} style={{
              fontSize: 12, fontWeight: 600, color: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.22)',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 999, padding: '7px 14px', cursor: 'pointer', flexShrink: 0,
            }}>
              Gestisci
            </button>
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
            letterSpacing: '0.12em', color: 'rgba(232,168,89,0.70)', marginBottom: 8, position: 'relative',
          }}>
            Bertie Supporter
          </p>
          <p style={{ fontSize: 19, fontWeight: 700, color: '#FFFFFF', marginBottom: 4, position: 'relative' }}>
            Supporta Bertie
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18, position: 'relative' }}>
            €9,99/anno · meno di €1 al mese · zero pubblicità
          </p>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '0 0 20px',
            display: 'flex', flexDirection: 'column', gap: 8, position: 'relative',
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
            action: () => window.open('https://bertie.app/privacy', '_blank'),
          },
          {
            Icon: MessageCircle, label: 'Feedback', sub: 'Aiutaci a migliorare Bertie',
            color: '#2E7D52', bg: '#F0FBF4',
            action: () => window.open('mailto:feedback@bertie.app', '_blank'),
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
const AMAZON_TAG    = import.meta.env.VITE_AMAZON_AFFILIATE_TAG    || 'bertie-21'
const ARCAPLANET_ID = import.meta.env.VITE_ARCAPLANET_AFFILIATE_ID || 'bertie001'

const CATEGORIE_ACC = [
  { id: 'tutti',         label: 'Tutti' },
  { id: 'alimentazione', label: 'Alimentazione' },
  { id: 'passeggiata',   label: 'Passeggiata' },
  { id: 'gioco',         label: 'Gioco' },
  { id: 'casa',          label: 'Casa' },
  { id: 'salute',        label: 'Salute' },
]

const PRODOTTI_MOCK = [
  { id: 1, cat: 'passeggiata',   nome: 'Pettorina ergonomica',       perche: 'Distribuisce la trazione sul petto · 25–30 kg.', prezzo: '€24,90', prezzoOld: '€32,90', deal: '-24%', fonte: 'amazon',     razze: ['Labrador','Tutti'] },
  { id: 2, cat: 'alimentazione', nome: 'Adult Medium 12 kg',         perche: 'Cani di taglia media, 3–7 anni.',                prezzo: '€39,90', prezzoOld: null,      deal: null,   fonte: 'arcaplanet', razze: ['Tutti'] },
  { id: 3, cat: 'casa',          nome: 'Memory foam ortopedica',     perche: 'Sfoderabile, lavabile a 30°.',                   prezzo: '€69,00', prezzoOld: '€89,00',  deal: null,   fonte: 'amazon',     razze: ['Tutti'] },
  { id: 4, cat: 'alimentazione', nome: 'Bocconcini al pollo',        perche: '250 g · per addestramento.',                    prezzo: '€6,49',  prezzoOld: null,      deal: null,   fonte: 'arcaplanet', razze: ['Tutti'] },
  { id: 5, cat: 'salute',        nome: 'Frontline Combo Spot-On L',  perche: 'Protezione pulci e zecche 4 settimane.',         prezzo: '€18,90', prezzoOld: null,      deal: null,   fonte: 'amazon',     razze: ['Tutti'] },
  { id: 6, cat: 'gioco',         nome: 'Kong Classic misura L',      perche: 'Resistente al morso forte.',                    prezzo: '€12,50', prezzoOld: null,      deal: null,   fonte: 'amazon',     razze: ['Tutti'] },
  { id: 7, cat: 'passeggiata',   nome: 'Guinzaglio retrattile 5 m',  perche: 'Freno ergonomico, nastro 5 m.',                 prezzo: '€14,99', prezzoOld: null,      deal: null,   fonte: 'amazon',     razze: ['Tutti'] },
  { id: 8, cat: 'salute',        nome: 'Advantix 25–40 kg',          perche: '4 pipette spot-on.',                            prezzo: '€22,40', prezzoOld: null,      deal: null,   fonte: 'arcaplanet', razze: ['Tutti'] },
]

function buildAffiliateUrl(fonte, nome) {
  if (fonte === 'amazon')
    return `https://www.amazon.it/s?k=${encodeURIComponent(nome)}&tag=${AMAZON_TAG}`
  return `https://www.arcaplanet.it/search?query=${encodeURIComponent(nome)}&ref=${ARCAPLANET_ID}`
}

// Placeholder image con pattern a trattini (come nel handoff)
function ProdImg({ label, fonte, deal, liked, onLike }) {
  return (
    <div className="relative" style={{ aspectRatio: '1/1', backgroundColor: '#FBF6E2',
      backgroundImage: 'repeating-linear-gradient(135deg, rgba(183,115,54,0.14) 0 6px, transparent 6px 14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Source badge */}
      <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-1 rounded-pill"
        style={fonte === 'amazon'
          ? { backgroundColor: '#2A2C2C', color: '#E8A859' }
          : { backgroundColor: '#E8A859', color: '#2A2C2C' }}>
        {fonte === 'amazon' ? 'Amazon' : 'Arcaplanet'}
      </span>
      {/* Like */}
      <button onClick={onLike}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#E8A859' : 'none'}
          stroke={liked ? '#E8A859' : '#464949'} strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
        </svg>
      </button>
      {/* Deal badge */}
      {deal && (
        <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-1 rounded-[6px]"
          style={{ backgroundColor: '#2A2C2C', color: '#F6ECC8' }}>{deal}</span>
      )}
      {/* Label */}
      <span className="text-[9px] font-medium px-2 py-1 rounded-[6px]"
        style={{ backgroundColor: '#F6ECC8', color: '#8C5524', fontFamily: 'var(--font-mono, monospace)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

function AccessoriView({ dogName, dogRazza }) {
  const [catFiltro, setCatFiltro] = useState('tutti')
  const [search, setSearch]       = useState('')
  const [liked, setLiked]         = useState({})

  const prodotti = PRODOTTI_MOCK.filter(p => {
    const catOk    = catFiltro === 'tutti' || p.cat === catFiltro
    const razzaOk  = !dogRazza || p.razze.includes('Tutti') || p.razze.includes(dogRazza)
    const searchOk = !search || p.nome.toLowerCase().includes(search.toLowerCase())
    return catOk && razzaOk && searchOk
  })

  // Hero contestuale: mostra se c'è un antipar. in scadenza entro 7 giorni
  const antiparInArrivo = vaccini.find(v => !v.scaduto && v.giorni <= 7)

  return (
    <div className="flex flex-col gap-0 -mx-4">

      {/* ── Card personalizzazione ── */}
      <div className="mx-4 mt-2 mb-3 px-3 py-3 rounded-[16px] flex items-center gap-3"
        style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#F6ECC8' }}>
          <img src="/bertie-logo.svg" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 9, fontWeight: 700, color: '#6B6E6E', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono, monospace)' }}>
            Scelti per
          </p>
          <p className="text-sm font-medium truncate" style={{ color: '#2A2C2C' }}>
            {dogName || 'Bertie'}{' '}
            <span style={{ color: '#6B6E6E', fontWeight: 400 }}>
              {dogRazza ? `· ${dogRazza}` : ''}
            </span>
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#B77336', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono, monospace)' }}>
          Cambia
        </span>
      </div>

      {/* ── Search ── */}
      <div className="mx-4 mb-3 px-3 py-2.5 rounded-[14px] flex items-center gap-2.5"
        style={{ backgroundColor: 'rgba(255,255,255,0.5)', border: '1px solid rgba(70,73,73,0.08)' }}>
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

      {/* ── Chip filtri ── */}
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

      {/* ── Hero contestuale ── */}
      {antiparInArrivo && (
        <div className="mx-4 mb-4 p-4 rounded-[20px] flex gap-3 items-center relative overflow-hidden"
          style={{ backgroundColor: '#E8A859' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140,
            backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div className="flex-1 relative z-10">
            <span className="text-[9px] font-bold px-2 py-1 rounded-pill mb-2 inline-block"
              style={{ backgroundColor: 'rgba(42,44,44,0.5)', color: '#F6ECC8', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
              Consigliato · scade tra {antiparInArrivo.giorni}gg
            </span>
            <h3 className="font-display text-white mb-1" style={{ fontSize: 20, lineHeight: 1.1 }}>
              L'<em>antiparassitario</em><br />di {dogName || 'Bertie'} è in arrivo.
            </h3>
            <p className="text-xs mb-2.5" style={{ color: 'rgba(255,255,255,0.9)' }}>Pipette spot-on per cani 20–40 kg.</p>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-pill inline-flex items-center gap-1"
              style={{ backgroundColor: '#FFFFFF', color: '#D28C45' }}>
              Riacquista · €24,50 →
            </span>
          </div>
          <div className="shrink-0 w-20 h-20 rounded-[18px] flex items-center justify-center relative z-10"
            style={{ backgroundColor: '#F6ECC8',
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(183,115,54,0.18) 0 6px, transparent 6px 14px)',
              fontFamily: 'monospace', fontSize: 9, color: '#8C5524', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pipette
          </div>
        </div>
      )}

      {/* ── Section header ── */}
      <div className="flex justify-end px-4 mb-2">
        <span style={{ fontSize: 9, fontWeight: 700, color: '#B77336', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
          Vedi tutti →
        </span>
      </div>

      {/* ── Griglia prodotti ── */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-2">
        {prodotti.map(p => (
          <div key={p.id} className="flex flex-col rounded-[16px] overflow-hidden"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
            <ProdImg
              label={p.nome.split(' ')[0]}
              fonte={p.fonte}
              deal={p.deal}
              liked={!!liked[p.id]}
              onLike={() => setLiked(l => ({ ...l, [p.id]: !l[p.id] }))}
            />
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p style={{ fontSize: 9, color: '#6B6E6E', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                {p.cat.charAt(0).toUpperCase() + p.cat.slice(1)}
              </p>
              <p className="font-display" style={{ fontSize: 16, lineHeight: 1.15, letterSpacing: '-0.005em', color: '#2A2C2C' }}>
                {p.nome}
              </p>
              <p style={{ fontSize: 11, color: '#6B6E6E', lineHeight: 1.35 }}>{p.perche}</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="font-display" style={{ fontSize: 16, color: '#2A2C2C', display: 'flex', gap: 5, alignItems: 'baseline' }}>
                  {p.prezzo}
                  {p.prezzoOld && (
                    <s style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#A7A8A8', fontStyle: 'normal' }}>
                      {p.prezzoOld}
                    </s>
                  )}
                </div>
                <a href={buildAffiliateUrl(p.fonte, p.nome)} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#E8A859' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <div className="mx-4 mb-4 mt-1 px-3 py-2.5 rounded-[12px]"
        style={{ border: '1px dashed rgba(70,73,73,0.18)', backgroundColor: 'rgba(255,255,255,0.5)' }}>
        <p style={{ fontSize: 9, color: '#6B6E6E', lineHeight: 1.4, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
          Bertie può ricevere una commissione sugli acquisti effettuati tramite questi link. Il prezzo per te non cambia.</p>
      </div>

    </div>
  )
}

// ─── Layout principale ──────────────────────────────────────────────────────
// Titoli in stile handoff: Instrument Serif 26px, parte finale in corsivo oro
const PAGE_TITLES = {
  mappa:     { pre: 'Map',    post: 'pa'   },
  aivet:     { pre: 'AI ',    post: 'Vet'  },
  diario:    { pre: 'Libret', post: 'to'   },
  accessori: { pre: 'Acces',  post: 'sori' },
  profilo:   { pre: 'Profi',  post: 'lo'   },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab]               = useState('vaccini')
  const [isSupporter, setIsSupporter]       = useState(false)
  const [supporterExpires, setSupporterExpires] = useState(null)
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
      supabase.from('profiles').select('supporter, supporter_expires').eq('id', u.id).maybeSingle(),
      supabase.from('dogs').select('name, breed, photo_url, weight, age_label, sex').eq('user_id', u.id).maybeSingle(),
    ])
    if (profile) {
      setIsSupporter(!!profile.supporter)
      setSupporterExpires(profile.supporter_expires || null)
    }
    if (dog) {
      setDogId(dog.id)
      setDogName(dog.name)
      setDogRazza(dog.breed)
      setDogPhotoUrl(dog.photo_url || null)
      setDogWeight(dog.weight || null)
      setDogAge(dog.age_label || null)
      setDogSex(dog.sex || null)
    }
  }

  // Carica al mount
  useEffect(() => { loadUser() }, [])

  // Ricarica ogni volta che la pagina torna visibile (es. ritorno dall'onboarding)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadUser() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Ritorno da Stripe con ?supporter=1
  useEffect(() => {
    if (searchParams.get('supporter') !== '1') return
    setSearchParams({}) // pulisce URL
    // Aspetta il webhook (max 6s) poi ricarica il profilo
    const poll = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 1200))
        const { data } = await supabase.from('profiles')
          .select('supporter, supporter_expires')
          .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .maybeSingle()
        if (data?.supporter) {
          setIsSupporter(true)
          setSupporterExpires(data.supporter_expires || null)
          break
        }
      }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
    poll()
  }, [])

  // Chiama Edge Function → redirect Stripe Checkout
  const handleUpgrade = async () => {
    if (!user) return
    setUpgrading(true)
    setUpgradeError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      window.location.href = json.url
    } catch (err) {
      setUpgradeError(err.message || 'Errore durante il checkout')
      setUpgrading(false)
    }
  }

  // Apre il portale Stripe per gestire l'abbonamento
  const handleManageSubscription = async () => {
    if (!user) return
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      window.location.href = json.url
    } catch (err) {
      console.error('Portale Stripe:', err.message)
    }
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
        <div className="shrink-0 pt-12" style={{ backgroundColor: '#F6ECC8' }} />
      ) : (
        /* Altre tab — top bar stile handoff: solo titolo serif */
        <header className="flex items-center px-5 pt-12 pb-3 shrink-0"
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
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {tab === 'vaccini'   && <SaluteView dogName={dogName} dogRazza={dogRazza} photoUrl={dogPhotoUrl} dogWeight={dogWeight} dogAge={dogAge} dogSex={dogSex} userName={userName} />}
        {tab === 'mappa'     && <MappaView />}
        {tab === 'aivet'     && <AIVetView isSupporter={isSupporter} />}
        {tab === 'diario'    && <LibrettoView dogName={dogName} dogId={dogId} />}
        {tab === 'accessori' && <AccessoriView dogName={dogName} dogRazza={dogRazza} />}
        {tab === 'profilo'   && (
          <ProfiloView
            navigate={navigate}
            user={user}
            isSupporter={isSupporter}
            supporterExpires={supporterExpires}
            onUpgrade={handleUpgrade}
            onManage={handleManageSubscription}
            upgrading={upgrading}
            upgradeError={upgradeError}
            dogName={dogName}
            dogRazza={dogRazza}
            photoUrl={dogPhotoUrl}
            onPhotoChange={(url) => setDogPhotoUrl(url)}
          />
        )}
      </div>

      {/* Banner ads — solo per non-supporter, esclusi Shop e Mappa */}
      {tab !== 'accessori' && tab !== 'mappa' && (
        <SupporterBanner isSupporter={isSupporter} onUpgrade={() => setTab('profilo')} />
      )}

      <BottomNav
        active={tab}
        onChange={(t) => { if (t === 'aivet' && !isSupporter) return; setTab(t) }}
        isPremium={isSupporter}
        notifiche={vaccini.filter(v => v.scaduto || v.giorni <= 30).length}
      />
    </AppShell>
  )
}
