/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F6F3',
        ledger: '#EBEEE8',
        ink: '#1B2430',
        muted: '#6B7280',
        line: '#D8DCD3',
        primary: {
          DEFAULT: '#1F6F5C',
          light: '#2F9E6E',
          dark: '#14493C',
        },
        debit: '#C6473C',
        credit: '#2F9E6E',
        gold: '#E8A33D',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        perforate:
          'repeating-linear-gradient(to right, transparent 0, transparent 6px, #D8DCD3 6px, #D8DCD3 8px)',
      },
    },
  },
  plugins: [],
};
