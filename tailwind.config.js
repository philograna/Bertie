/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bertie brand
        'bertie-gold':     '#E8A859',
        'bertie-gold-600': '#D28C45',
        'bertie-cream':    '#F6ECC8',
        'bertie-cream-50': '#FBF6E2',
        'bertie-ink':      '#2A2C2C',
        'bertie-ink-700':  '#464949',
        'bertie-ink-500':  '#6B6E6E',
        'bertie-caramel':  '#B77336',
        // Legacy aliases (mapped in index.css @layer utilities)
        'pale-sand':     '#F6ECC8',
        'off-white':     '#FBF6E2',
        'sky-blue':      '#E8A859',
        'ocean-deep':    '#2A2C2C',
        'true-black':    '#2A2C2C',
        'sunbeam-yellow':'#F0B97A',
        'slate-gray':    '#6B6E6E',
        'glacier-blue':  '#EFE0A8',
        'sea-mist':      '#D28C45',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans:    ['"Geist"', 'system-ui', 'sans-serif'],
        nunito:  ['"Instrument Serif"', 'Georgia', 'serif'], // remap for legacy class
      },
      borderRadius: {
        'card': '22px',
        'btn':  '999px',
        'tag':  '999px',
      },
    },
  },
  plugins: [],
}
