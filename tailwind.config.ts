import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Times New Roman', 'serif'],
      },
      colors: {
        // WhatsApp green — slightly deeper for premium feel
        wa: {
          DEFAULT: '#1FB955',
          hover:   '#19A44A',
          dark:    '#0E5D32',
          light:   '#E6F8EE',
          soft:    '#E6F8EE',
          border:  '#BBF7D0',
        },
        // App surfaces — warm
        app: {
          bg:      '#FBF7EF',   // cream
          card:    '#FFFFFF',
          paper:   '#F6F2EA',
          border:  '#E2E8F0',
        },
        // Ink — warm navy
        ink: {
          DEFAULT: '#0B1220',
          2:       '#1F2A44',
          mute:    '#6B7385',
        },
        // Action / heat
        orange: {
          DEFAULT: '#FF6A2C',
          hover:   '#F25B1A',
          ink:     '#B23E0A',
          soft:    '#FFF1E8',
        },
        // Trust / business
        sky: {
          DEFAULT: '#3F7BDC',
          soft:    '#EAF2FF',
          ink:     '#1E3F87',
        },
        // Order status semantic colors
        status: {
          pending:    '#F59E0B',
          confirmed:  '#3B82F6',
          processing: '#9333EA',
          delivered:  '#10B981',
          cancelled:  '#EF4444',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.25rem',
      },
      boxShadow: {
        'ios':    '0 2px 10px -4px rgba(0,0,0,0.05), 0 10px 20px -8px rgba(0,0,0,0.04)',
        'soft':   '0 4px 20px -4px rgba(0,0,0,0.03)',
        'float':  '0 20px 40px -12px rgba(0,0,0,0.15)',
        'sheet':  '0 -10px 40px -10px rgba(0,0,0,0.12)',
        'wa':     '0 12px 28px rgba(31, 185, 85, 0.28)',
        'orange': '0 12px 28px rgba(255, 106, 44, 0.28)',
        'hi':     '0 10px 24px rgba(15,23,42,0.08), 0 30px 60px rgba(15,23,42,0.16)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'soft':   'cubic-bezier(.2,.7,.2,1)',
      },
    },
  },
  plugins: [],
};

export default config;
