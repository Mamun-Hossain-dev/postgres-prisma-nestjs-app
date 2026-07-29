import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0b',
        paper: '#f7f7f8',
        accent: '#b4472f',
        sage: '#667085',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(10, 10, 11, 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
