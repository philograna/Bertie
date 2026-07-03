import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronRight, Search } from 'lucide-react'
import { Geolocation } from '@capacitor/geolocation'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ─── Costanti ───────────────────────────────────────────────────────────────
const FILTRI = [
  { id: 'tutti',        label: 'Tutti' },
  { id: 'parco',        label: 'Parchi' },
  { id: 'ristorante',   label: 'Ristoranti' },
  { id: 'hotel',        label: 'Hotel' },
  { id: 'veterinario',  label: 'Veterinari' },
  { id: 'toelettatore', label: 'Toelettatori' },
]

const CAT_COLOR = {
  parco:        '#E6F4F0',
  ristorante:   '#FFF3E6',
  hotel:        '#EEE6FF',
  veterinario:  '#E8F8E8',
  toelettatore: '#E6EEFF',
}

// ─── Haversine ───────────────────────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── RoverBanner ─────────────────────────────────────────────────────────────
function RoverBanner({ city }) {
  const roverUrl = `https://www.rover.com/it/search/?location=${encodeURIComponent(city || 'Milano')}`
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => window.open(roverUrl, '_system')}
        style={{
          backgroundColor: '#E8A859', borderRadius: 14, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <MapPin size={22} style={{ color: '#FFFFFF', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
              Cerchi un dog sitter?
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', margin: '2px 0 0', lineHeight: 1.3 }}>
              Sitter verificati vicino a te
            </p>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); window.open(roverUrl, '_system') }}
          style={{
            backgroundColor: '#FFFFFF', color: '#E8A859', fontWeight: 700,
            fontSize: 13, border: 'none', borderRadius: 999, padding: '7px 14px',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          Cerca →
        </button>
      </div>
      <p style={{
        fontSize: 9, color: '#A7A8A8', textAlign: 'right', margin: '3px 4px 0',
        fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Powered by Rover.com
      </p>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-[16px]"
      style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
      <div className="w-10 h-10 rounded-[12px] shrink-0 animate-pulse" style={{ backgroundColor: '#F0EAD6' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 rounded-full animate-pulse w-3/4" style={{ backgroundColor: '#F0EAD6' }} />
        <div className="h-2.5 rounded-full animate-pulse w-1/2" style={{ backgroundColor: '#F6ECC8' }} />
      </div>
      <div className="w-12 h-5 rounded-full animate-pulse" style={{ backgroundColor: '#F6ECC8' }} />
    </div>
  )
}

// ─── LuoghiView ──────────────────────────────────────────────────────────────
export default function LuoghiView({ city: cityProp = '' }) {
  const [luoghi, setLuoghi]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filtro, setFiltro]     = useState('tutti')
  const [query, setQuery]       = useState('')
  const [userPos, setUserPos]   = useState(null)
  const [cityName, setCityName] = useState(cityProp)
  const debounceRef             = useRef(null)
  const fetchedRef              = useRef(false)

  // 1. Ottieni posizione — getCurrentPosition gestisce il permesso iOS internamente
  useEffect(() => {
    let cancelled = false
    const tryGeo = async () => {
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        })
        if (!cancelled) setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      } catch (err) {
        // Fallback web
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => { if (!cancelled) setUserPos({ lat: coords.latitude, lng: coords.longitude }) },
            () => { if (!cancelled) { setLoading(false); setError('position_denied') } },
            { enableHighAccuracy: true, timeout: 15000 }
          )
        } else {
          if (!cancelled) { setLoading(false); setError('position_denied') }
        }
      }
    }
    tryGeo()
    return () => { cancelled = true }
  }, [])

  // 2. Reverse geocoding città
  useEffect(() => {
    if (cityProp) { setCityName(cityProp); return }
    if (!userPos) return
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userPos.lat}&lon=${userPos.lng}`,
      { headers: { 'Accept-Language': 'it' } })
      .then(r => r.json())
      .then(d => {
        const c = d.address?.city || d.address?.town || d.address?.village || ''
        if (c) setCityName(c)
      })
      .catch(() => {})
  }, [userPos, cityProp])

  // 3. Chiama Edge Function con le coordinate
  useEffect(() => {
    if (!userPos || fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)

    fetch(`${SUPABASE_URL}/functions/v1/places-nearby`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: userPos.lat, lng: userPos.lng }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        const withDist = (data.places || []).map(p => ({
          ...p,
          distanza: getDistance(userPos.lat, userPos.lng, p.lat, p.lng),
        })).sort((a, b) => a.distanza - b.distanza)
        setLuoghi(withDist)
      })
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [userPos])

  // Filtra + cerca
  const handleSearch = (val) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(val), 300)
  }

  const visibili = luoghi
    .filter(l => filtro === 'tutti' || l.type === filtro)
    .filter(l => {
      if (!query) return true
      const q = query.toLowerCase()
      return l.name?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q)
    })

  const openMaps = (l) => {
    window.open(`maps://maps.apple.com/?daddr=${l.lat},${l.lng}&dirflg=d`, '_system')
  }

  return (
    <div className="flex flex-col gap-3">

      <RoverBanner city={cityName} />

      {/* Search */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px]"
        style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(70,73,73,0.10)' }}>
        <Search size={14} style={{ color: '#A7A8A8', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Cerca un posto..."
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: '#2A2C2C', fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {/* Filtri */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTRI.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-pill transition-colors"
            style={filtro === f.id
              ? { backgroundColor: '#2A2C2C', color: '#F6ECC8', border: '1px solid #2A2C2C' }
              : { backgroundColor: 'rgba(255,255,255,0.7)', color: '#464949', border: '1px solid rgba(70,73,73,0.10)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stati */}
      {loading && (
        <div className="flex flex-col gap-2">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {!loading && error === 'position_denied' && (
        <div className="flex flex-col items-center py-12 gap-2">
          <MapPin size={32} style={{ color: '#B77336' }} />
          <p className="text-sm font-semibold text-center" style={{ color: '#2A2C2C' }}>
            Posizione non disponibile
          </p>
          <p className="text-xs text-center" style={{ color: '#6B6E6E', maxWidth: '28ch' }}>
            Attiva la geolocalizzazione per vedere i posti vicino a te.
          </p>
        </div>
      )}

      {!loading && !error && visibili.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-2">
          <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>Nessun posto trovato</p>
          <p className="text-xs text-center" style={{ color: '#6B6E6E', maxWidth: '28ch' }}>
            Prova a cambiare categoria o a cercare per nome.
          </p>
        </div>
      )}

      {/* Lista */}
      {!loading && !error && visibili.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibili.map(l => (
            <button key={l.id} onClick={() => openMaps(l)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] text-left w-full active:opacity-70 transition-opacity"
              style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)', border: 'none', cursor: 'pointer' }}>

              {/* Icona categoria */}
              <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: CAT_COLOR[l.type] || '#FBF6E2' }}>
                <MapPin size={16} style={{ color: '#B77336' }} />
              </div>

              {/* Testi */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#2A2C2C' }}>{l.name}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#6B6E6E' }}>{l.address}</p>
                {l.rating && (
                  <p className="text-xs mt-0.5" style={{ color: '#B77336' }}>
                    {l.rating.toFixed(1)} / 5
                    {l.open_now === true && <span style={{ color: '#2E7D52', marginLeft: 6 }}>Aperto</span>}
                    {l.open_now === false && <span style={{ color: '#B04040', marginLeft: 6 }}>Chiuso</span>}
                  </p>
                )}
              </div>

              {/* Distanza + freccia */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-pill"
                  style={{ backgroundColor: '#FBF6E2', color: '#B77336' }}>
                  {l.distanza < 1
                    ? `${Math.round(l.distanza * 1000)} m`
                    : `${l.distanza.toFixed(1)} km`}
                </span>
                <ChevronRight size={14} style={{ color: '#A7A8A8' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
