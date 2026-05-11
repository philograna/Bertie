import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'

const features = [
  { bg: 'bg-sky-blue',        emoji: '💉', title: 'Tracker Vaccini',     body: 'Reminder automatici prima di ogni scadenza.', badge: 'Free' },
  { bg: 'bg-sunbeam-yellow',  emoji: '📍', title: 'Mappa Dog-Friendly',  body: 'Parchi, spiagge e ristoranti in tutta Italia.', badge: 'Free' },
  { bg: 'bg-sea-mist',        emoji: '🩺', title: 'AI Veterinario',      body: 'Valuta i sintomi del tuo cane con l\'AI.',     badge: 'Premium' },
  { bg: 'bg-glacier-blue',    emoji: '👥', title: 'Community',           body: 'Passeggiate di gruppo nel tuo quartiere.',    badge: 'Premium' },
]

export default function Home() {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col overflow-y-auto pb-10">

        {/* Hero */}
        <div className="px-6 pt-16 pb-8">
          <p className="text-4xl mb-4">🐾</p>
          <h1 className="text-3xl font-extrabold text-ocean-deep font-nunito leading-tight mb-3">
            Un solo posto<br />per tutta la vita<br />del tuo cane.
          </h1>
          <p className="text-sm text-slate-gray mb-8">
            L'app italiana per proprietari di cani — vaccini, salute, mappa dog-friendly e molto altro. Gratis nel core, Premium a <strong className="text-ocean-deep">€0,99/mese</strong>.
          </p>
          <Link
            to="/registrati"
            className="block w-full py-4 bg-sky-blue text-true-black font-extrabold text-base rounded-btn text-center"
          >
            Aggiungi il tuo cane →
          </Link>
          <Link
            to="/login"
            className="block w-full py-3.5 mt-3 border-2 border-ocean-deep text-ocean-deep font-extrabold text-base rounded-btn text-center"
          >
            Accedi
          </Link>
          <p className="text-center text-xs text-slate-gray mt-4">
            7 milioni di cani in Italia — il loro posto è qui.
          </p>
        </div>

        {/* Feature cards */}
        <div className="px-6 flex flex-col gap-3">
          {features.map((f) => (
            <div key={f.title} className={`${f.bg} rounded-card p-5 flex items-start gap-4`}>
              <span className="text-3xl">{f.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-extrabold text-ocean-deep font-nunito">{f.title}</p>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-tag ${f.badge === 'Free' ? 'bg-off-white text-ocean-deep' : 'bg-ocean-deep text-pale-sand'}`}>
                    {f.badge}
                  </span>
                </div>
                <p className="text-xs text-ocean-deep opacity-80">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Personas */}
        <div className="px-6 mt-6 flex flex-col gap-3">
          <h2 className="text-lg font-extrabold text-ocean-deep font-nunito">Chi usa Kompet</h2>
          {[
            { emoji: '👩', name: 'Giulia, 32 · Milano', quote: '"Usavo 4 app diverse, ora ho tutto qui."' },
            { emoji: '👨', name: 'Marco, 45 · Roma', quote: '"I reminder vaccini mi hanno salvato più volte."' },
          ].map((p) => (
            <div key={p.name} className="bg-off-white rounded-card p-4 flex items-start gap-3">
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <p className="text-sm font-extrabold text-ocean-deep">{p.name}</p>
                <p className="text-sm text-slate-gray italic mt-0.5">{p.quote}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mx-6 mt-8 bg-sky-blue rounded-card p-6 text-center flex flex-col gap-3">
          <p className="font-extrabold text-ocean-deep font-nunito text-lg">Pronto a iniziare?</p>
          <p className="text-xs text-ocean-deep opacity-80">Gratis per sempre nel piano base.</p>
          <Link
            to="/registrati"
            className="block py-3.5 bg-ocean-deep text-pale-sand font-extrabold text-sm rounded-btn"
          >
            Inizia gratis →
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
