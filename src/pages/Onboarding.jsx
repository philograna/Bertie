import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AppShell from '../components/AppShell'
import { supabase } from '../lib/supabase'
import { initNotifications } from '../lib/notifications'

const RAZZE = [
  'Labrador Retriever', 'Golden Retriever', 'Pastore Tedesco', 'Bulldog Francese',
  'Bulldog Inglese', 'Barboncino', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer',
  'Dachshund', 'Siberian Husky', 'Dobermann', 'Shih Tzu', 'Border Collie', 'Cocker Spaniel',
  'Maltese', 'Chihuahua', 'Setter Irlandese', 'Bracco Italiano', 'Lagotto Romagnolo',
  'Spinone Italiano', 'Cane Corso', 'Segugio Italiano', 'Volpino Italiano',
  "Cirneco dell'Etna", 'Maremmano', 'Pastore Bergamasco', 'Bolognese',
  'Levriero Italiano', 'Schnauzer', 'Alano', 'Shar Pei', 'Chow Chow', 'Akita Inu',
  'Shiba Inu', 'Samoiedo', 'Terranova', 'San Bernardo', 'Dalmatico', 'Weimaraner',
  'Jack Russell Terrier', 'West Highland Terrier', 'Pomerania', 'Carlino', 'Meticcio',
]

const G = {
  gold:     '#E8A859',
  cream:    '#F6ECC8',
  cream200: '#EFE0A8',
  ink:      '#2A2C2C',
  ink500:   '#6B6E6E',
}

const NUNITO = '"Nunito", system-ui, sans-serif'

function calcAge(dateStr) {
  if (!dateStr) return null
  const birth = new Date(dateStr)
  const now   = new Date()
  let years  = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth()    - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years === 0 && months === 0) return 'meno di un mese'
  const parts = []
  if (years  > 0) parts.push(`${years}  ${years  === 1 ? 'anno'  : 'anni'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mese'  : 'mesi'}`)
  return parts.join(' e ')
}

export default function Onboarding() {
  const navigate      = useNavigate()
  const photoRef      = useRef(null)
  const cameraRef     = useRef(null)

  const [step, setStep]           = useState(1)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState('')
  const [notifLoading, setNotifLoading] = useState(false)
  const [savedUserId, setSavedUserId]   = useState(null)

  const [dog, setDog] = useState({
    nome: '', razza: '', microchip: '',
    dataNascita: '', sesso: '', peso: '',
    photoFile: null, photoPreview: null,
  })
  const [razzaQuery,    setRazzaQuery]    = useState('')
  const [showDropdown,  setShowDropdown]  = useState(false)

  const set = (k, v) => setDog(d => ({ ...d, [k]: v }))

  /* ── Autocomplete ── */
  const filtered = razzaQuery.length > 0
    ? RAZZE.filter(r => r.toLowerCase().includes(razzaQuery.toLowerCase())).slice(0, 5)
    : []

  const selectRazza = (r) => {
    set('razza', r)
    setRazzaQuery(r)
    setShowDropdown(false)
  }

  const handleMicrochip = (v) => set('microchip', v.replace(/\D/g, '').slice(0, 15))

  /* ── Foto ── */
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setDog(d => ({ ...d, photoFile: file, photoPreview: URL.createObjectURL(file) }))
  }

  /* ── Validazione step ── */
  const canNext1 = dog.nome.trim() && dog.razza
  const ageLabel = calcAge(dog.dataNascita)
  const today    = new Date().toISOString().split('T')[0]

  /* ── Salvataggio ── */
  const handleSave = async () => {
    setSaving(true); setSaveError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      // Upload foto (opzionale — errore silenzioso)
      let photoUrl = null
      if (dog.photoFile) {
        const ext  = dog.photoFile.name.split('.').pop()
        const path = `${user.id}/dog.${ext}`
        const { error: upErr } = await supabase.storage
          .from('dog-photos')
          .upload(path, dog.photoFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      }

      const payload = {
        user_id:    user.id,
        name:       dog.nome.trim(),
        breed:      dog.razza,
        age_label:  ageLabel || '',
        birth_date: dog.dataNascita || null,
        sex:        dog.sesso,
        weight:     dog.peso ? parseFloat(dog.peso.replace(',', '.')) : null,
        microchip:  dog.microchip || null,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      }

      const { error } = await supabase
        .from('dogs')
        .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
      if (error) throw error
      setSavedUserId(user.id)
      setStep(3)
    } catch (err) {
      console.error('Errore salvataggio:', err)
      setSaveError(err.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pb-10" style={{ fontFamily: NUNITO, textAlign: 'center', paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>

        {/* ── Step bar (nascosta negli step completamento) ── */}
        {step < 3 && (
          <div className="flex items-center gap-3 mb-6">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{ backgroundColor: G.cream }}>
                <ChevronLeft size={18} style={{ color: G.ink }} />
              </button>
            )}
            <div className="flex-1">
              <div className="flex gap-1.5 mb-3">
                {[1, 2].map(s => (
                  <div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{ backgroundColor: s <= step ? G.gold : G.cream200 }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: G.ink500 }}>Passo {step} di 2</p>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: G.ink }}>
              Raccontaci di più del tuo amico
            </h1>
            <p className="text-sm mb-5" style={{ color: G.ink500 }}>
              Come si chiama il tuo cane?
            </p>

            {/* Input foto (hidden, usati in step 2 e 3) */}
            <input ref={photoRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handlePhotoSelect} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }} onChange={handlePhotoSelect} />

            {/* Nome */}
            <input type="text" placeholder="Nome del cane"
              value={dog.nome} onChange={e => set('nome', e.target.value)}
              className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none focus:ring-2 placeholder-slate-gray mb-4"
              style={{ backgroundColor: G.cream, color: G.ink, textAlign: 'center' }} />

            {/* Razza autocomplete */}
            <p className="text-sm font-semibold mb-2" style={{ color: G.ink }}>Che tipo di cane è?</p>
            <div style={{ position: 'relative' }} className="mb-4">
              <input type="text" placeholder="Cerca la razza..."
                value={razzaQuery}
                onChange={e => { setRazzaQuery(e.target.value); set('razza', ''); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none focus:ring-2 placeholder-slate-gray"
                style={{ backgroundColor: G.cream, color: G.ink, textAlign: 'center' }} />

              {showDropdown && (filtered.length > 0 || razzaQuery.length > 0) && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  backgroundColor: '#FFFFFF', borderRadius: 10,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)', overflow: 'hidden',
                }}>
                  {filtered.map(r => (
                    <button key={r} onMouseDown={() => selectRazza(r)}
                      className="w-full text-left px-5 py-3 text-sm transition-colors"
                      style={{ color: G.ink, borderBottom: `1px solid ${G.cream200}`,
                        backgroundColor: 'transparent' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = G.cream}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      {r}
                    </button>
                  ))}
                  <button onMouseDown={() => { set('razza', razzaQuery || 'Altra razza'); setRazzaQuery(razzaQuery || 'Altra razza'); setShowDropdown(false) }}
                    className="w-full text-left px-5 py-3 text-sm"
                    style={{ color: G.ink500 }}>
                    Altra razza
                  </button>
                </div>
              )}
            </div>

            {/* Microchip */}
            <p className="text-sm font-semibold mb-1" style={{ color: G.ink }}>
              Numero microchip{' '}
              <span style={{ color: G.ink500, fontWeight: 400 }}>(opzionale)</span>
            </p>
            <input type="text" inputMode="numeric"
              placeholder="Es. 380260004123456"
              value={dog.microchip}
              onChange={e => handleMicrochip(e.target.value)}
              className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none focus:ring-2 placeholder-slate-gray mb-1"
              style={{ backgroundColor: G.cream, color: G.ink, textAlign: 'center' }} />
            <p className="text-xs mb-auto" style={{ color: G.ink500 }}>
              15 cifre — lo trovi sul libretto sanitario
            </p>

            <button onClick={() => canNext1 && setStep(2)} disabled={!canNext1}
              className="mt-6 w-full py-4 rounded-btn font-semibold text-base transition-colors"
              style={{ backgroundColor: '#E8A859', color: '#FFFFFF', opacity: canNext1 ? 1 : 0.5 }}>
              Continua →
            </button>
          </>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: G.ink }}>
              Quanti anni ha {dog.nome}?
            </h1>
            <p className="text-sm mb-5" style={{ color: G.ink500 }}>
              Ci aiuta a calcolare i reminder giusti.
            </p>

            {/* Data di nascita */}
            <p className="text-sm font-semibold mb-2" style={{ color: G.ink }}>
              Data di nascita{' '}
              <span style={{ color: G.ink500, fontWeight: 400 }}>(opzionale)</span>
            </p>
            <input type="date" max={today}
              value={dog.dataNascita}
              onChange={e => set('dataNascita', e.target.value)}
              className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none mb-2"
              style={{
                backgroundColor: G.cream,
                color: dog.dataNascita ? G.ink : G.ink500,
                WebkitAppearance: 'none',
                textAlign: 'center',
              }} />
            <div className="mb-5" style={{ minHeight: 20 }}>
              {ageLabel && (
                <p className="text-sm font-medium" style={{ color: G.gold }}>
                  {dog.nome} ha {ageLabel}
                </p>
              )}
            </div>

            {/* Sesso */}
            <p className="text-sm font-semibold mb-3" style={{ color: G.ink }}>Sesso</p>
            <div className="flex gap-3 mb-5">
              {[{ v: 'M', l: '♂ Maschio' }, { v: 'F', l: '♀ Femmina' }].map(({ v, l }) => (
                <button key={v} onClick={() => set('sesso', v)}
                  className="flex-1 py-3.5 rounded-card text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: dog.sesso === v ? G.gold : G.cream,
                    color: dog.sesso === v ? '#FFFFFF' : G.ink500,
                  }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Peso */}
            <p className="text-sm font-semibold mb-2" style={{ color: G.ink }}>
              Peso{' '}
              <span style={{ color: G.ink500, fontWeight: 400 }}>(opzionale)</span>
            </p>
            <div className="relative mb-auto">
              <input type="number" inputMode="decimal" placeholder="es. 28.5"
                value={dog.peso} onChange={e => set('peso', e.target.value)}
                className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none focus:ring-2 placeholder-slate-gray pr-14"
                style={{ backgroundColor: G.cream, color: G.ink, textAlign: 'center' }} />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: G.ink500 }}>kg</span>
            </div>

            {saveError && (
              <p className="mt-3 text-xs text-center px-3 py-2 rounded-[10px]"
                style={{ backgroundColor: 'rgba(176,64,64,0.1)', color: '#B04040' }}>
                ⚠️ {saveError}
              </p>
            )}

            <button onClick={() => { setSaveError(''); dog.sesso && handleSave() }}
              disabled={!dog.sesso || saving}
              className="mt-4 w-full py-4 rounded-btn font-semibold text-base flex items-center justify-center gap-2"
              style={{ backgroundColor: '#E8A859', color: '#FFFFFF', opacity: (!dog.sesso || saving) ? 0.5 : 1 }}>
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Salvataggio…' : 'Salva →'}
            </button>
          </>
        )}

        {/* ════════════════ STEP 3 ════════════════ */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-5">
            {/* Foto o placeholder con invito */}
            {dog.photoPreview
              ? <img src={dog.photoPreview} alt={dog.nome}
                  style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                    border: `3px solid ${G.gold}` }} />
              : (
                <div className="flex flex-col items-center gap-3">
                  <div style={{ width: 96, height: 96, borderRadius: '50%',
                    backgroundColor: G.cream200, border: `2.5px dashed ${G.gold}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 30, color: G.gold, fontWeight: 300 }}>+</span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: G.ink }}>
                    Aggiungi un bel sorriso al profilo di {dog.nome}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => photoRef.current.click()}
                      style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px',
                        borderRadius: 999, border: `1.5px solid ${G.cream200}`,
                        backgroundColor: G.cream, color: G.ink500, cursor: 'pointer' }}>
                      Galleria
                    </button>
                    <button onClick={() => cameraRef.current.click()}
                      style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px',
                        borderRadius: 999, border: `1.5px solid ${G.gold}`,
                        backgroundColor: G.gold, color: '#FFFFFF', cursor: 'pointer' }}>
                      Scatta foto
                    </button>
                  </div>
                </div>
              )
            }
            <div>
              <h1 className="text-2xl font-extrabold mb-2" style={{ color: G.ink }}>
                {dog.nome} è pronto!
              </h1>
              <p className="text-sm" style={{ color: G.ink500 }}>
                {[
                  dog.razza,
                  ageLabel,
                  dog.sesso ? (dog.sesso === 'M' ? 'Maschio' : 'Femmina') : null,
                  dog.peso ? `${dog.peso} kg` : null,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
            <p className="text-sm max-w-xs" style={{ color: G.ink500 }}>
              Ora attiva i reminder — ti avvisiamo prima che scadano vaccini e antiparassitari.
            </p>
            <div className="w-full flex flex-col gap-3 mt-4">
              <button onClick={() => setStep(4)}
                className="w-full py-4 rounded-btn font-semibold text-base"
                style={{ backgroundColor: G.gold, color: '#FFFFFF' }}>
                Attiva reminder →
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="text-sm font-medium" style={{ color: G.ink500 }}>
                Farlo dopo
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 4 — Notifiche ════════════════ */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-5">
            {/* Icona campanella */}
            <div style={{ width: 80, height: 80, borderRadius: '50%',
              backgroundColor: G.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Z" fill={G.gold} />
                <path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z" fill={G.gold} />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold mb-2" style={{ color: G.ink }}>
                Attiva i reminder
              </h1>
              <p className="text-sm max-w-xs" style={{ color: G.ink500, lineHeight: 1.6 }}>
                Ti avvisiamo 30 giorni prima che scada un vaccino e 7 giorni prima per gli antiparassitari.
                Gratis, niente spam.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={async () => {
                  setNotifLoading(true)
                  const uid = savedUserId || (await supabase.auth.getUser()).data?.user?.id
                  if (uid) await initNotifications(uid)
                  setNotifLoading(false)
                  navigate('/dashboard')
                }}
                disabled={notifLoading}
                className="w-full py-4 rounded-btn font-semibold text-base flex items-center justify-center gap-2"
                style={{ backgroundColor: G.gold, color: '#FFFFFF', opacity: notifLoading ? 0.7 : 1 }}>
                {notifLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {notifLoading ? 'Attivazione…' : 'Attiva reminder'}
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="text-sm font-medium" style={{ color: G.ink500 }}>
                Forse dopo
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
