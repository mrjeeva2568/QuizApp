/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Ink teal" - the primary brand hue. Deliberately not Tailwind's default
        // indigo/blue-600; reads studious/focused rather than generic SaaS.
        brand: {
          50: '#eefaf8',
          100: '#d4f1ec',
          200: '#a8e3da',
          300: '#71cec0',
          400: '#3fb0a0',
          500: '#1f8f80',
          600: '#146b60',
          700: '#125650',
          800: '#124440',
          900: '#0f3733',
          950: '#082220',
        },
        // Neutral scale used for text and dark-mode surfaces - cooler/deeper
        // than Tailwind's default slate, ties back to the brand hue.
        ink: {
          50: '#f5f7f8',
          100: '#e8ecee',
          200: '#c8d1d6',
          300: '#9fb0b8',
          400: '#6d838d',
          500: '#4a5e68',
          600: '#374850',
          700: '#2b3941',
          800: '#202b31',
          900: '#141c20',
          950: '#0b1013',
        },
        // Warm amber accent - used sparingly (scores, highlights, the signature
        // score-ring). Never used for body text or large fills.
        accent: {
          50: '#fdf6e9',
          100: '#f9e8c2',
          200: '#f2d38c',
          300: '#e9ba52',
          400: '#dba52f',
          500: '#c48f1f',
          600: '#a1721a',
          700: '#7c581a',
          800: '#61461c',
          900: '#4e3a1c',
        },
        success: {
          50: '#eefbf3',
          500: '#2f9e68',
          600: '#237d52',
        },
        danger: {
          50: '#fdf1ee',
          500: '#c4432b',
          600: '#a5361f',
        },
        paper: {
          DEFAULT: '#faf9f6',
          dark: '#0e1418',
        },
      },
      fontFamily: {
        // Display face carries the brand personality (headings, wordmark).
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        // Body/UI face - neutral, highly legible at small sizes.
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Utility face for scores, stats, timestamps - tabular figures read
        // cleanly in a dashboard, and it visually distinguishes "data" from "prose".
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 55 51 / 0.06), 0 1px 3px 0 rgb(15 55 51 / 0.08)',
      },
    },
  },
  plugins: [],
};
