/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        px: {
          bg:      '#0b0f1a',
          panel:   '#141b2d',
          border:  '#2a3550',
          border2: '#3d4d75',
          text:    '#e8f1ff',
          dim:     '#8fa3c8',
          accent:  '#ffd166',
          accent2: '#4a7fd4',
          danger:  '#e04141',
          good:    '#4caf50',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', '"Courier New"', 'monospace'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        pixel: '4px 4px 0 0 rgba(0,0,0,0.65)',
        'pixel-sm': '2px 2px 0 0 rgba(0,0,0,0.65)',
        glow: '0 0 12px rgba(255,209,102,0.35)',
      },
    },
  },
  plugins: [],
};