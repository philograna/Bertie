import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AppShell from '../components/AppShell'
import { supabase } from '../lib/supabase'

const NOTIFICHE = [
  {
    id: 'vaccini',
    emoji: '💉',
    label: 'Vaccini in scadenza',
    sub: 'Avviso 30 giorni prima della scadenza',
  },
  {
    id: 'antiparassitari',
    emoji: '💊',
    label: 'Antiparassitari',
    sub: 'Reminder mensile per pulci e zecche',
  },
  {
    id: 'appuntamenti',
    emoji: '📅',
    label: 'Appuntamenti',
    sub: 'Promemoria il giorno prima',
  },
  {
    id: 'toelettatura',
    emoji: '✂️',
    label: 'Toelettatura',
    sub: 'Avviso quando è ora di una nuova seduta',
  },
  {
    id: 'consigli',
    emoji: '🐾',
    label: 'Consigli del giorno',
    sub: 'Un tip quotidiano per il tuo cane',
  },
]

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="shrink-0 transition-colors"
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        backgroundColor: value ? '#E8A859' : '#D9D9D9',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: value ? 21 : 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

export default function Notifiche() {
  const navigate = useNavigate()
  const [masterOn, setMasterOn] = useState(false)
  const [prefs, setPrefs]       = useState(() =>
    Object.fromEntries(NOTIFICHE.map((n) => [n.id, true]))
  )
  const [permesso, setPermesso] = useState(null) // 'granted' | 'denied' | 'default' | null

  useEffect(() => {
    if ('Notification' in window) setPermesso(Notification.permission)
  }, [])

  const handleMaster = async (val) => {
    if (val && 'Notification' in window && Notification.permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermesso(result)
      if (result !== 'granted') return
    }
    setMasterOn(val)
  }

  const togglePref = (id) => {
    if (!masterOn) return
    setPrefs((p) => ({ ...p, [id]: !p[id] }))
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F6ECC8' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0"
          style={{ backgroundColor: '#F6ECC8' }}>
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: 'rgba(42,44,44,0.08)' }}
          >
            <ChevronLeft size={18} style={{ color: '#2A2C2C' }} />
          </button>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#2A2C2C',
            margin: 0,
            lineHeight: 1,
          }}>
            Notifi<em style={{ fontStyle: 'italic', color: '#D28C45' }}>che</em>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-10 flex flex-col gap-4">

          {/* Avviso permesso negato */}
          {permesso === 'denied' && (
            <div className="rounded-[14px] px-4 py-3"
              style={{ backgroundColor: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.2)' }}>
              <p className="text-xs font-semibold" style={{ color: '#B04040' }}>
                Le notifiche sono bloccate dal browser. Vai nelle impostazioni del dispositivo per abilitarle.
              </p>
            </div>
          )}

          {/* Master toggle */}
          <div className="rounded-[18px] px-4 py-4 flex items-center gap-3"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: masterOn ? '#FBF6E2' : '#F4F4F4' }}>
              🔔
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>Attiva notifiche</p>
              <p className="text-xs" style={{ color: '#6B6E6E' }}>
                {masterOn ? 'Notifiche attive' : 'Nessuna notifica verrà inviata'}
              </p>
            </div>
            <Toggle value={masterOn} onChange={handleMaster} />
          </div>

          {/* Lista categorie */}
          <div className="rounded-[18px] overflow-hidden"
            style={{ backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-soft)' }}>
            {NOTIFICHE.map((n, i) => (
              <div
                key={n.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderBottom: i < NOTIFICHE.length - 1 ? '1px solid #F6ECC8' : 'none',
                  opacity: masterOn ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: '#FBF6E2' }}>
                  {n.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>{n.label}</p>
                  <p className="text-xs" style={{ color: '#6B6E6E' }}>{n.sub}</p>
                </div>
                <Toggle value={masterOn && prefs[n.id]} onChange={() => togglePref(n.id)} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </AppShell>
  )
}
