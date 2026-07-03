import { Home, MapPin, Stethoscope, BookOpen, ShoppingBag } from 'lucide-react'

// Icona logo Bertie per il tab Profilo
function BertieLogoIcon({ size = 20, active }) {
  return (
    <img
      src="/bertie-logo.svg"
      alt="Profilo"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        opacity: active ? 1 : 0.4,
        transition: 'opacity 0.15s',
      }}
    />
  )
}

const ALL_TABS = [
  { id: 'vaccini',   icon: Home,        label: 'Home',     premium: false },
  { id: 'aivet',     icon: Stethoscope, label: 'AI Vet',   premium: false },
  { id: 'diario',    icon: BookOpen,    label: 'Libretto', premium: false },
  { id: 'accessori', icon: ShoppingBag, label: 'Shop',     premium: false },
  { id: 'mappa',     icon: MapPin,      label: 'Luoghi',   premium: false },
  { id: 'profilo',   icon: null,        label: 'Profilo',  premium: false, isLogo: true },
]

export default function BottomNav({ active, onChange, isPremium, notifiche = 0, bannerOffset = 0 }) {
  const TABS = ALL_TABS.filter(t => !t.premium || isPremium)

  return (
    <nav
      className="bottom-nav fixed left-1/2 -translate-x-1/2 w-full border-t flex items-center justify-around px-1 pb-safe"
      style={{
        bottom: bannerOffset,
        maxWidth: 430,
        backgroundColor: '#F6ECC8',
        borderColor: '#EFE0A8',
      }}
    >
      {TABS.map(({ id, icon: Icon, label, isLogo }) => {
        const isActive = active === id
        const showBadge = id === 'diario' && notifiche > 0
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex flex-col items-center gap-0.5 py-3 px-2 min-w-[48px] transition-colors"
          >
            <div className="relative">
              {isLogo ? (
                <BertieLogoIcon size={32} active={isActive} />
              ) : (
                <Icon
                  size={32}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? '#E8A859' : '#A7A8A8' }}
                />
              )}
              {showBadge && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold px-1"
                  style={{ backgroundColor: '#B77336', color: '#FFFFFF' }}>
                  {notifiche}
                </span>
              )}
            </div>
            <span
              className="text-[9px] font-semibold"
              style={{ color: isActive ? '#E8A859' : '#A7A8A8' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
