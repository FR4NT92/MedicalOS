import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nura: {
          canvas: '#EAEAEB',
          card: '#FFFFFF',
          pillInactive: '#F3F3F4',
          pillActive: '#111111',
          sageLight: '#DDE7E0',
          sageMedium: '#C9DACF',
          sageDark: '#7A9886',
          sageText: '#2D5A3A',
          textMain: '#111111',
          textMuted: '#777777',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
        'full': '9999px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
