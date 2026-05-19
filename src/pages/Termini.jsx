import { useNavigate } from 'react-router-dom'

const C = {
  biscuit: '#F6ECC8',
  gold:    '#E8A859',
  honey:   '#D28C45',
  bowtie:  '#464949',
  muted:   '#6B6E6E',
  cream50: '#FBF6E2',
  cream200:'#EFE0A8',
  white:   '#FFFFFF',
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{
      fontFamily: 'var(--font-display)', fontWeight: 400,
      fontSize: 22, color: C.bowtie, margin: '0 0 12px',
      letterSpacing: '-0.01em',
    }}>
      {title}
    </h2>
    <div style={{ fontSize: 15, lineHeight: 1.75, color: C.muted }}>
      {children}
    </div>
  </div>
)

export default function Termini() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: C.biscuit, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{
        backgroundColor: C.bowtie, padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(255,255,255,0.65)', fontSize: 22, lineHeight: 1,
          }}>
          ←
        </button>
        <img src="/bertie-wordmark.svg" alt="Bertie" style={{ height: 28 }} />
      </div>

      {/* Contenuto */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em',
          color: C.bowtie, margin: '0 0 8px',
        }}>
          Termini e condizioni
        </h1>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 48 }}>
          Ultimo aggiornamento: maggio 2025
        </p>

        <Section title="1. Accettazione dei termini">
          <p>Utilizzando Bertie accetti i presenti Termini e Condizioni. Se non li accetti, ti chiediamo di non utilizzare l'app.</p>
        </Section>

        <Section title="2. Descrizione del servizio">
          <p>Bertie è un'applicazione per la gestione della salute e del benessere del tuo cane. Offre funzionalità come il fascicolo sanitario digitale, il tracker vaccini e antiparassitari, la mappa dog-friendly e la community locale.</p>
        </Section>

        <Section title="3. Account utente">
          <p>Per accedere a determinate funzionalità è necessario creare un account. Sei responsabile della riservatezza delle credenziali e di tutte le attività svolte tramite il tuo account.</p>
        </Section>

        <Section title="4. Programma di affiliazione">
          <p>
            Bertie partecipa al Programma di Affiliazione Amazon e ad altri programmi di partner selezionati.
            Questo significa che <strong style={{ color: C.bowtie }}>Bertie può ricevere una commissione sugli acquisti effettuati tramite i link presenti nell'app</strong>, senza alcun costo aggiuntivo per te.
          </p>
          <p style={{ marginTop: 12 }}>
            I prezzi e la disponibilità dei prodotti mostrati sono soggetti a variazioni. Verifica sempre il prezzo finale sulla piattaforma di acquisto prima di completare l'ordine.
          </p>
        </Section>

        <Section title="5. Limitazione di responsabilità">
          <p>Le informazioni presenti su Bertie (vaccini, dosaggi, consigli sanitari) hanno scopo puramente informativo e non sostituiscono il parere del veterinario. Per qualsiasi dubbio sulla salute del tuo cane, consulta sempre un professionista.</p>
        </Section>

        <Section title="6. Privacy">
          <p>Il trattamento dei dati personali è disciplinato dalla nostra{' '}
            <a href="/privacy" style={{ color: C.gold, textDecoration: 'none', fontWeight: 500 }}>
              Privacy Policy
            </a>.
          </p>
        </Section>

        <Section title="7. Modifiche ai termini">
          <p>Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche saranno comunicate tramite notifica in-app o via email. L'uso continuato del servizio dopo la modifica costituisce accettazione dei nuovi termini.</p>
        </Section>

        <Section title="8. Contatti">
          <p>Per qualsiasi domanda relativa ai presenti Termini puoi scriverci a{' '}
            <a href="mailto:ciao@bertieapp.it" style={{ color: C.gold, textDecoration: 'none', fontWeight: 500 }}>
              ciao@bertieapp.it
            </a>.
          </p>
        </Section>

      </div>
    </div>
  )
}
