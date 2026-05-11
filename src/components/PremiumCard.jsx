/**
 * PremiumCard — versione salvata, da riattivare in futuro.
 *
 * Utilizzo:
 *   import PremiumCard from '../components/PremiumCard'
 *   <PremiumCard onUpgrade={onUpgrade} upgrading={upgrading} upgradeError={upgradeError} isPremium={isPremium} />
 */

export default function PremiumCard({ isPremium, onUpgrade, upgrading, upgradeError }) {
  if (isPremium) {
    return (
      <div className="rounded-[18px] px-4 py-3.5 flex items-center gap-3"
        style={{ backgroundColor: '#FBF6E2', border: '1.5px solid #EFE0A8' }}>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-lg"
          style={{ backgroundColor: '#F6ECC8' }}>⭐</div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#2A2C2C' }}>Bertie Premium attivo</p>
          <p className="text-xs" style={{ color: '#6B6E6E' }}>€0,99/mese · Rinnovo automatico</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-pill"
          style={{ backgroundColor: '#E8A859', color: '#FFFFFF' }}>
          Attivo
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#2A2C2C' }}>
      <div className="px-5 pt-5 pb-4">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#E8A859',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          Bertie completo
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#FFFFFF',
          letterSpacing: '-0.015em', lineHeight: 1.1, marginBottom: 4 }}>
          Premium <em style={{ color: '#E8A859' }}>€0,99</em>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12,
            color: 'rgba(255,255,255,0.5)', fontStyle: 'normal' }}>/mese</span>
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['AI Vet', 'Passaporto EU', 'Groomer', 'Community', 'Illimitati'].map(f => (
            <span key={f} className="text-[10px] font-semibold px-2.5 py-1 rounded-pill"
              style={{ backgroundColor: 'rgba(232,168,89,0.18)', color: '#E8A859' }}>
              · {f}
            </span>
          ))}
        </div>
      </div>
      {upgradeError && (
        <p className="mx-5 mb-3 text-xs font-semibold px-3 py-2 rounded-[12px]"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
          ⚠️ {upgradeError}
        </p>
      )}
      <div className="px-5 pb-5">
        <button
          onClick={onUpgrade}
          disabled={upgrading}
          className="w-full py-3.5 rounded-pill font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity"
          style={{ backgroundColor: '#E8A859', color: '#FFFFFF',
            boxShadow: '0 6px 16px -4px rgba(232,168,89,0.5)' }}
        >
          {upgrading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {upgrading ? 'Apertura checkout…' : '⭐ Attiva Premium — €0,99/mese'}
        </button>
        <p className="text-center text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Annulla in qualsiasi momento
        </p>
      </div>
    </div>
  )
}
