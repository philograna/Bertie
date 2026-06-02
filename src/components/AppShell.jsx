export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6ECC8' }}>
      <div
        className="relative w-full overflow-hidden flex flex-col"
        style={{ maxWidth: 430, minHeight: '100dvh', backgroundColor: '#F6ECC8' }}
      >
        {children}
      </div>
    </div>
  )
}
