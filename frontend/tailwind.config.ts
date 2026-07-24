import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171816',
        paper: '#f4f1e9',
        accent: '#d96c3d',
        sage: '#77816b',
      },
      boxShadow: {
        soft: '0 20px 70px rgba(23, 24, 22, 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
