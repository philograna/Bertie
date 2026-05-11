import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import AppShell from '../components/AppShell'

const RAZZE = ['Labrador', 'Golden Retriever', 'Pastore Tedesco', 'Bulldog Fr.', 'Beagle', 'Chihuahua', 'Barboncino', 'Boxer', 'Husky', 'Altro']
const ETA   = ['< 1 anno', '1 anno', '2 anni', '3 anni', '4 anni', '5 anni', '6 anni', '7+ anni']

const G = {
  gold:      '#E8A859',
  goldHover: '#D28C45',
  cream:     '#F6ECC8',
  cream50:   '#FBF6E2',
  cream200:  '#EFE0A8',
  ink:       '#2A2C2C',
  ink500:    '#6B6E6E',
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dog, setDog] = useState({ nome: '', razza: '', eta: '', sesso: '' })
  const set = (k, v) => setDog((d) => ({ ...d, [k]: v }))

  const canNext1 = dog.nome.trim() && dog.razza
  const canNext2 = dog.eta && dog.sesso

  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pt-14 pb-10">

        {/* Header con step bar */}
        <div className="flex items-center gap-3 mb-6">
          {step > 1 && step < 3 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full"
              style={{ backgroundColor: G.cream }}
            >
              <ChevronLeft size={18} style={{ color: G.ink }} />
            </button>
          )}
          <div className="flex-1">
            <div className="flex gap-1.5 mb-3">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-1.5 flex-1 rounded-tag transition-all duration-300"
                  style={{ backgroundColor: s <= step ? G.gold : G.cream200 }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: G.ink500 }}>Passo {step} di 3</p>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-extrabold font-nunito mb-1" style={{ color: G.ink }}>
              Come si chiama il tuo cane? 🐶
            </h1>
            <p className="text-sm mb-6" style={{ color: G.ink500 }}>Aggiungi il profilo del tuo amico a 4 zampe.</p>

            <input
              type="text"
              placeholder="Nome del cane"
              value={dog.nome}
              onChange={(e) => set('nome', e.target.value)}
              className="w-full px-5 py-4 rounded-card text-base border-0 focus:outline-none focus:ring-2 ring-sky-blue placeholder-slate-gray mb-5"
              style={{ backgroundColor: G.cream, color: G.ink }}
            />

            <p className="text-sm font-semibold mb-3" style={{ color: G.ink }}>Razza</p>
            <div className="grid grid-cols-2 gap-2 mb-auto">
              {RAZZE.map((r) => (
                <button
                  key={r}
                  onClick={() => set('razza', r)}
                  className="py-3 px-4 rounded-card text-sm font-medium text-left transition-colors"
                  style={{
                    backgroundColor: dog.razza === r ? G.gold : G.cream,
                    color: dog.razza === r ? '#FFFFFF' : G.ink500,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={() => canNext1 && setStep(2)}
              disabled={!canNext1}
              className="mt-6 w-full py-4 rounded-btn font-semibold text-base disabled:opacity-40 transition-colors"
              style={{ backgroundColor: G.gold, color: '#FFFFFF' }}
            >
              Continua →
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-extrabold font-nunito mb-1" style={{ color: G.ink }}>
              Quanti anni ha {dog.nome}? 🎂
            </h1>
            <p className="text-sm mb-6" style={{ color: G.ink500 }}>Ci aiuta a calcolare i reminder giusti.</p>

            <p className="text-sm font-semibold mb-3" style={{ color: G.ink }}>Età</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ETA.map((e) => (
                <button
                  key={e}
                  onClick={() => set('eta', e)}
                  className="py-3 rounded-card text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: dog.eta === e ? G.gold : G.cream,
                    color: dog.eta === e ? '#FFFFFF' : G.ink500,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <p className="text-sm font-semibold mb-3" style={{ color: G.ink }}>Sesso</p>
            <div className="flex gap-3 mb-auto">
              {[{ v: 'M', l: '♂ Maschio' }, { v: 'F', l: '♀ Femmina' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => set('sesso', v)}
                  className="flex-1 py-3.5 rounded-card text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: dog.sesso === v ? G.gold : G.cream,
                    color: dog.sesso === v ? '#FFFFFF' : G.ink500,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={() => canNext2 && setStep(3)}
              disabled={!canNext2}
              className="mt-6 w-full py-4 rounded-btn font-semibold text-base disabled:opacity-40"
              style={{ backgroundColor: G.gold, color: '#FFFFFF' }}
            >
              Continua →
            </button>
          </>
        )}

        {/* Step 3 — Celebrazione */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-5">
            <div className="text-7xl">🎉</div>
            <div>
              <h1 className="text-2xl font-extrabold font-nunito mb-2" style={{ color: G.ink }}>
                {dog.nome} è pronto!
              </h1>
              <p className="text-sm" style={{ color: G.ink500 }}>
                {dog.razza} · {dog.eta} · {dog.sesso === 'M' ? 'Maschio' : 'Femmina'}
              </p>
            </div>
            <p className="text-sm max-w-xs" style={{ color: G.ink500 }}>
              Ora aggiungi i vaccini e attiva i reminder push — è gratuito.
            </p>
            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 rounded-btn font-semibold text-base"
                style={{ backgroundColor: G.gold, color: '#FFFFFF' }}
              >
                Vai alla dashboard →
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm font-medium"
                style={{ color: G.ink500 }}
              >
                Farlo dopo
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
