import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, Plus, ChevronRight, Send, Lock, Syringe, MapPin, BookOpen, Dog, Camera } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import BottomNav from '../components/BottomNav'

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


const diario = [
  { data: '28 Apr 2025', tipo: '🩺', label: 'Visita',   titolo: 'Visita annuale',       note: 'Tutto ok. Peso: 28 kg.' },
  { data: '10 Mar 2025', tipo: '💊', label: 'Farmaco',  titolo: 'Antiparassitario',     note: 'Frontline applicato.' },
  { data: '02 Feb 2025', tipo: '⚠️', label: 'Sintomo',  titolo: 'Zoppia lieve',         note: 'Risolta in 3 giorni.' },
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

function SaluteView({ dogName, dogRazza, photoUrl, userName }) {
  const scaduti = vaccini.filter(v => v.scaduto).length
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
            {dogRazza || 'Labrador'} · 3 anni · 28,4 kg
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
        {vaccini.map((v) => (
          <div key={v.nome}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid #F6ECC8' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>{v.nome}</p>
              <p className="text-xs" style={{ color: '#A7A8A8' }}>{v.data}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-pill"
              style={{
                backgroundColor: v.scaduto ? '#B77336' : v.giorni <= 60 ? '#F0B97A' : '#E8A859',
                color: '#FFFFFF',
              }}>
              {v.scaduto ? 'Scaduto' : `${v.giorni} gg`}
            </span>
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
    <div className="flex flex-col gap-4">
      {/* Mappa */}
      {!userPos && !geoError ? (
        <div className="rounded-card h-44 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: '#EFE0A8' }}>
          <div className="w-6 h-6 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-gray">Rilevando posizione...</p>
        </div>
      ) : (
        <div style={{ height: 200, borderRadius: 20, overflow: 'hidden' }}>
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
        <p className="text-xs text-slate-gray px-1">📍 Posizione non disponibile</p>
      )}

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTRI.map(f => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className="shrink-0 px-4 py-1.5 rounded-tag text-sm font-bold transition-colors"
            style={{
              backgroundColor: filtro === f.id ? '#E8A859' : '#F6ECC8',
              color: filtro === f.id ? '#FFFFFF' : '#6B6E6E',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-4 h-4 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-gray">Cerco luoghi nelle vicinanze...</p>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-2">
          {visibili.length === 0 && userPos && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🐾</p>
              <p className="text-sm font-bold text-ocean-deep">Nessun luogo trovato</p>
              <p className="text-xs text-slate-gray mt-1">Entro {MAX_KM} km · prova un'altra categoria</p>
            </div>
          )}
          {visibiliPaginati.map(l => (
            <div key={l.id} className="flex items-center justify-between p-4 bg-off-white rounded-card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{l.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-ocean-deep">{l.nome}</p>
                  <p className="text-xs text-slate-gray">{l.indirizzo ? `${l.indirizzo} · ` : ''}{l.km.toFixed(2)} km</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-gray" />
            </div>
          ))}
          {hasMore && (
            <button
              onClick={() => setPagina(p => p + 1)}
              className="w-full py-3 rounded-card text-sm font-bold"
              style={{ backgroundColor: '#FBF6E2', color: '#6B6E6E', border: '1.5px solid #EFE0A8' }}
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
function AIVetView({ isPremium }) {
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Ciao! Sono il vet AI di Bertie 🐾 Descrivi i sintomi del tuo cane.' },
  ])
  const [input, setInput] = useState('')
  const [count, setCount] = useState(0)

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-6 px-2">
        <div className="w-20 h-20 rounded-full bg-glacier-blue flex items-center justify-center">
          <Lock size={32} className="text-sky-blue" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-ocean-deep font-nunito mb-1">AI Veterinario</h3>
          <p className="text-sm text-slate-gray">Valuta i sintomi del tuo cane con l'intelligenza artificiale.</p>
        </div>
        <div className="w-full bg-off-white rounded-card p-4 text-left flex flex-col gap-2">
          {['10 domande/mese con AI', 'Prenotazione groomer', 'Passaporto digitale EU', 'Community locale', 'Animali illimitati'].map((f) => (
            <p key={f} className="text-sm text-ocean-deep flex items-center gap-2">
              <span className="text-sky-blue font-extrabold">✓</span> {f}
            </p>
          ))}
        </div>
        <button className="w-full py-4 bg-sky-blue text-true-black font-extrabold text-base rounded-btn">
          ⭐ Attiva Premium — €0,99/mese
        </button>
        <p className="text-xs text-slate-gray">Annulla in qualsiasi momento</p>
      </div>
    )
  }

  const send = () => {
    if (!input.trim() || count >= 10) return
    setMsgs((m) => [...m,
      { role: 'user', text: input },
      { role: 'ai', text: 'Grazie. Ti consiglio di monitorare per 24 ore. Se i sintomi persistono, contatta il tuo veterinario. Hai altri dettagli?' },
    ])
    setCount((c) => c + 1)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-[18px] text-sm ${m.role === 'user' ? 'bg-sky-blue text-ocean-deep rounded-br-sm' : 'bg-off-white text-ocean-deep rounded-bl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={count >= 10 ? 'Limite raggiunto' : 'Descrivi i sintomi...'}
          disabled={count >= 10}
          className="flex-1 px-4 py-3 rounded-[14px] bg-off-white text-sm text-true-black placeholder-slate-gray border-0 focus:outline-none focus:ring-2 focus:ring-sky-blue disabled:opacity-50"
        />
        <button onClick={send} disabled={!input.trim() || count >= 10} className="w-12 h-12 flex items-center justify-center bg-sky-blue rounded-[14px] disabled:opacity-40">
          <Send size={18} className="text-ocean-deep" />
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-gray mt-2">{count}/10 domande usate</p>
    </div>
  )
}

// ─── Sezione Diario ─────────────────────────────────────────────────────────
function DiarioView() {
  return (
    <div className="flex flex-col gap-3">
      <button className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed border-sky-blue text-sky-blue font-bold text-sm rounded-card">
        <Plus size={16} /> Nuova voce nel diario
      </button>
      {diario.map((v, i) => (
        <div key={i} className="bg-off-white rounded-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-tag bg-glacier-blue text-ocean-deep">
              {v.tipo} {v.label}
            </span>
            <span className="text-xs text-slate-gray">{v.data}</span>
          </div>
          <p className="font-extrabold text-ocean-deep text-sm">{v.titolo}</p>
          <p className="text-xs text-slate-gray">{v.note}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Sezione Profilo ────────────────────────────────────────────────────────
function ProfiloView({ navigate, user, isPremium, onUpgrade, upgrading, upgradeError }) {
  const [photoUrl, setPhotoUrl]   = useState(null)
  const [dogName, setDogName]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  // Carica profilo cane da Supabase
  useEffect(() => {
    if (!user) return
    supabase.from('dogs').select('name, photo_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDogName(data.name || null)
          setPhotoUrl(data.photo_url || null)
        }
      })
  }, [user])

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview locale immediata
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
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Dog card */}
      <div className="bg-sky-blue rounded-card p-6 flex flex-col items-center gap-3">
        {/* Avatar con bottone fotocamera */}
        <div className="relative">
          <div
            className="w-24 h-24 bg-off-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer"
            style={{ border: '3px solid #FBF6E2' }}
            onClick={() => fileRef.current?.click()}
          >
            {photoUrl
              ? <img src={photoUrl} alt="foto cane" className="w-full h-full object-cover" />
              : <img src="/bertie-logo.svg" alt="Bertie" className="w-full h-full object-contain" style={{ backgroundColor: '#F6ECC8' }} />
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: '#2A2C2C' }}
          >
            {uploading
              ? <div className="w-3.5 h-3.5 border-2 border-pale-sand border-t-transparent rounded-full animate-spin" />
              : <Camera size={14} className="text-pale-sand" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <p className="font-extrabold text-ocean-deep font-nunito text-lg">
          {dogName || 'Il mio cane'}
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-6 py-2.5 bg-ocean-deep text-pale-sand font-bold text-sm rounded-btn"
        >
          {dogName ? '✏️ Modifica profilo' : '+ Aggiungi profilo'}
        </button>
      </div>

      {/* Card Premium */}
      {!isPremium && (
        <div className="rounded-card p-4 flex flex-col gap-3"
          style={{ background: 'linear-gradient(135deg, #E8A859 0%, #B77336 100%)' }}>
          <div>
            <p className="font-extrabold font-nunito text-lg text-white">⭐ Bertie Premium</p>
            <p className="text-xs text-white opacity-80 mt-0.5">AI Veterinario · Passaporto EU · Groomer · Community</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['AI Vet illimitato', 'Passaporto EU', 'Prenotazione groomer', 'Community locale'].map(f => (
              <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-tag"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>
                ✓ {f}
              </span>
            ))}
          </div>
          {upgradeError && (
            <p className="text-xs font-semibold px-3 py-2 rounded-card"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#FFFFFF' }}>
              ⚠️ {upgradeError}
            </p>
          )}
          <button
            onClick={onUpgrade}
            disabled={upgrading}
            className="w-full py-3.5 rounded-btn font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity"
            style={{ backgroundColor: '#FFFFFF', color: '#E8A859' }}
          >
            {upgrading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {upgrading ? 'Apertura checkout...' : 'Attiva Premium — €0,99/mese'}
          </button>
          <p className="text-[10px] text-center text-white opacity-60">Annulla in qualsiasi momento</p>
        </div>
      )}

      {isPremium && (
        <div className="rounded-card p-4 flex items-center gap-3"
          style={{ backgroundColor: '#FBF6E2', border: '1.5px solid #EFE0A8' }}>
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#2A2C2C' }}>Bertie Premium attivo</p>
            <p className="text-xs" style={{ color: '#6B6E6E' }}>€0,99/mese · Rinnovo automatico</p>
          </div>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-tag"
            style={{ backgroundColor: '#E8A859', color: '#FFFFFF' }}>
            Attivo
          </span>
        </div>
      )}

      {/* Settings list */}
      <div className="bg-off-white rounded-card overflow-hidden">
        {[
          { icon: '🔔', label: 'Notifiche' },
          { icon: '🔒', label: 'Privacy e dati' },
          { icon: '💬', label: 'Feedback' },
          { icon: '📤', label: 'Esci' },
        ].map((item, i, arr) => (
          <button key={item.label} className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-pale-sand transition-colors ${i < arr.length - 1 ? 'border-b border-glacier-blue' : ''}`}>
            <span className="flex items-center gap-3 text-sm font-semibold text-ocean-deep">
              <span>{item.icon}</span> {item.label}
            </span>
            <ChevronRight size={14} className="text-slate-gray" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Sezione Accessori ──────────────────────────────────────────────────────
const AMAZON_TAG      = import.meta.env.VITE_AMAZON_AFFILIATE_TAG      || 'bertie-21'
const ARCAPLANET_ID   = import.meta.env.VITE_ARCAPLANET_AFFILIATE_ID   || 'bertie001'

const CATEGORIE_ACC = [
  { id: 'tutti',     label: 'Tutti' },
  { id: 'cibo',      label: '🦴 Cibo' },
  { id: 'salute',    label: '💊 Salute' },
  { id: 'accessori', label: '🎒 Accessori' },
  { id: 'giochi',    label: '🎾 Giochi' },
]

const PRODOTTI_MOCK = [
  { id: 1, cat: 'cibo',      nome: 'Royal Canin Adult Labrador',    prezzo: '€54,90', fonte: 'amazon',     emoji: '🦴', razze: ['Labrador', 'Tutti'] },
  { id: 2, cat: 'cibo',      nome: 'Monge Grain Free Adult',        prezzo: '€28,50', fonte: 'arcaplanet', emoji: '🦴', razze: ['Tutti'] },
  { id: 3, cat: 'salute',    nome: 'Frontline Combo Spot-On (L)',    prezzo: '€18,90', fonte: 'amazon',     emoji: '💊', razze: ['Tutti'] },
  { id: 4, cat: 'salute',    nome: 'Advantix 4–10 kg (4 pipette)',   prezzo: '€22,40', fonte: 'arcaplanet', emoji: '💊', razze: ['Tutti'] },
  { id: 5, cat: 'accessori', nome: 'Guinzaglio retrattile 5 m',      prezzo: '€14,99', fonte: 'amazon',     emoji: '🎒', razze: ['Tutti'] },
  { id: 6, cat: 'accessori', nome: 'Pettorina Julius-K9 tg. L',      prezzo: '€39,90', fonte: 'arcaplanet', emoji: '🎒', razze: ['Labrador','Golden Retriever','Husky'] },
  { id: 7, cat: 'giochi',    nome: 'Kong Classic misura L',          prezzo: '€12,50', fonte: 'amazon',     emoji: '🎾', razze: ['Tutti'] },
  { id: 8, cat: 'giochi',    nome: 'Pallina da riporto Chuckit!',    prezzo: '€8,90',  fonte: 'arcaplanet', emoji: '🎾', razze: ['Labrador','Golden Retriever','Beagle'] },
  { id: 9, cat: 'cibo',      nome: 'Hill\'s Science Plan Puppy',     prezzo: '€42,00', fonte: 'amazon',     emoji: '🦴', razze: ['Tutti'] },
  { id:10, cat: 'accessori', nome: 'Cuccia ortopedica M/L',          prezzo: '€59,90', fonte: 'arcaplanet', emoji: '🎒', razze: ['Tutti'] },
]

function buildAffiliateUrl(fonte, nome) {
  if (fonte === 'amazon')
    return `https://www.amazon.it/s?k=${encodeURIComponent(nome)}&tag=${AMAZON_TAG}`
  return `https://www.arcaplanet.it/search?query=${encodeURIComponent(nome)}&ref=${ARCAPLANET_ID}`
}

function AccessoriView({ dogName, dogRazza }) {
  const [catFiltro, setCatFiltro] = useState('tutti')

  const prodotti = PRODOTTI_MOCK.filter(p => {
    const catOk = catFiltro === 'tutti' || p.cat === catFiltro
    const razzaOk = !dogRazza || p.razze.includes('Tutti') || p.razze.includes(dogRazza)
    return catOk && razzaOk
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Intestazione personalizzata */}
      <div className="rounded-card p-4" style={{ backgroundColor: '#F6ECC8' }}>
        <p className="text-xs font-medium mb-0.5" style={{ color: '#6B6E6E' }}>Consigliato per</p>
        <p className="font-extrabold font-nunito text-lg" style={{ color: '#2A2C2C' }}>
          {dogName || 'il tuo cane'} {dogRazza ? `· ${dogRazza}` : ''}
        </p>
      </div>

      {/* Filtri categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIE_ACC.map(c => (
          <button
            key={c.id}
            onClick={() => setCatFiltro(c.id)}
            className="shrink-0 px-4 py-1.5 rounded-tag text-sm font-medium transition-colors"
            style={{
              backgroundColor: catFiltro === c.id ? '#E8A859' : '#F6ECC8',
              color: catFiltro === c.id ? '#FFFFFF' : '#6B6E6E',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Griglia prodotti */}
      <div className="grid grid-cols-2 gap-3">
        {prodotti.map(p => (
          <div key={p.id} className="flex flex-col rounded-card overflow-hidden"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 0 rgba(0,0,0,.02), 0 12px 28px -18px rgba(140,85,36,.20)' }}>
            {/* Immagine placeholder */}
            <div className="h-24 flex items-center justify-center text-4xl"
              style={{ backgroundColor: '#FBF6E2' }}>
              {p.emoji}
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
              {/* Tag fonte */}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-tag w-fit"
                style={{
                  backgroundColor: p.fonte === 'amazon' ? '#EFE0A8' : '#F0B97A',
                  color: '#2A2C2C',
                }}>
                {p.fonte === 'amazon' ? '📦 Amazon' : '🐾 Arcaplanet'}
              </span>
              <p className="text-xs font-semibold leading-snug" style={{ color: '#2A2C2C' }}>{p.nome}</p>
              <p className="text-sm font-bold" style={{ color: '#E8A859' }}>{p.prezzo}</p>
              <a
                href={buildAffiliateUrl(p.fonte, p.nome)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-full py-2 rounded-btn text-xs font-semibold text-center transition-colors"
                style={{ backgroundColor: '#E8A859', color: '#FFFFFF' }}
              >
                Acquista →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer affiliazione */}
      <p className="text-[10px] text-center pb-2" style={{ color: '#A7A8A8' }}>
        Bertie può ricevere una commissione sugli acquisti effettuati tramite questi link.
      </p>
    </div>
  )
}

// ─── Layout principale ──────────────────────────────────────────────────────
const TITLES = { vaccini: 'Salute', mappa: 'Mappa 📍', aivet: 'AI Veterinario', diario: 'Diario', accessori: 'Shop 🛍️', profilo: 'Profilo' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab]               = useState('vaccini')
  const [isPremium, setIsPremium]   = useState(false)
  const [upgrading, setUpgrading]   = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [showSuccess, setShowSuccess]   = useState(false)
  const [user, setUser]             = useState(null)
  const [dogName, setDogName]         = useState(null)
  const [dogRazza, setDogRazza]       = useState(null)
  const [dogPhotoUrl, setDogPhotoUrl] = useState(null)
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
      supabase.from('profiles').select('premium').eq('id', u.id).maybeSingle(),
      supabase.from('dogs').select('name, breed, photo_url').eq('user_id', u.id).maybeSingle(),
    ])
    if (profile) setIsPremium(!!profile.premium)
    if (dog)     { setDogName(dog.name); setDogRazza(dog.breed); setDogPhotoUrl(dog.photo_url || null) }
  }

  useEffect(() => { loadUser() }, [])

  // Ritorno da Stripe con ?upgraded=1
  useEffect(() => {
    if (searchParams.get('upgraded') !== '1') return
    setSearchParams({}) // pulisce URL
    // Aspetta il webhook (max 5s) poi ricarica il profilo
    const poll = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 1200))
        const { data } = await supabase.from('profiles')
          .select('premium').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .maybeSingle()
        if (data?.premium) { setIsPremium(true); break }
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

  return (
    <AppShell>
      {/* Toast successo upgrade */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-btn text-sm font-semibold shadow-lg"
          style={{ backgroundColor: '#E8A859', color: '#FFFFFF', maxWidth: 360 }}>
          🎉 Benvenuto in Bertie Premium!
        </div>
      )}

      {/* Top bar */}
      {tab === 'vaccini' ? (
        /* Home tab — header minimale: solo safe-area + campanella */
        <header className="flex items-center justify-end px-5 pt-12 pb-1 shrink-0"
          style={{ backgroundColor: '#F6ECC8' }}>
          <button className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FFFFFF' }}>
            <Bell size={18} style={{ color: '#2A2C2C' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#F0B97A' }} />
          </button>
        </header>
      ) : (
        /* Altre tab — header standard con titolo */
        <header className="flex items-center justify-between px-5 pt-12 pb-3 shrink-0"
          style={{ backgroundColor: '#F6ECC8' }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#E8A859', letterSpacing: '0.04em' }}>🐾 Bertie</p>
            <h1 className="text-xl font-extrabold font-display" style={{ color: '#2A2C2C' }}>
              {TITLES[tab]}
            </h1>
          </div>
          <button className="relative w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FFFFFF' }}>
            <Bell size={18} style={{ color: '#2A2C2C' }} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#F0B97A' }} />
          </button>
        </header>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {tab === 'vaccini'   && <SaluteView dogName={dogName} dogRazza={dogRazza} photoUrl={dogPhotoUrl} userName={userName} />}
        {tab === 'mappa'     && <MappaView />}
        {tab === 'aivet'     && <AIVetView isPremium={isPremium} />}
        {tab === 'diario'    && <DiarioView />}
        {tab === 'accessori' && <AccessoriView dogName={dogName} dogRazza={dogRazza} />}
        {tab === 'profilo'   && (
          <ProfiloView
            navigate={navigate}
            user={user}
            isPremium={isPremium}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
            upgradeError={upgradeError}
          />
        )}
      </div>

      <BottomNav
        active={tab}
        onChange={(t) => { if (t === 'aivet' && !isPremium) return; setTab(t) }}
        isPremium={isPremium}
      />
    </AppShell>
  )
}
