import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'Orbitron', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse 2s infinite',
        'damage-float': 'damageFloat 0.8s ease-out forwards',
        'click-ripple': 'clickRipple 0.6s ease-out forwards',
        'click-ripple-mobile': 'clickRippleMobile 0.5s ease-out forwards',
      },
      keyframes: {
        damageFloat: {
          '0%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -80%) scale(1.5)' }
        },
        clickRipple: {
          '0%': { width: '0', height: '0', opacity: '1' },
          '100%': { width: '300px', height: '300px', opacity: '0' }
        },
        clickRippleMobile: {
          '0%': { width: '0', height: '0', opacity: '1' },
          '100%': { width: '200px', height: '200px', opacity: '0' }
        }
      },
      colors: {
        'cyber-blue': '#00ffff',
        'cyber-dark': '#0a0a0a',
        'cyber-purple': '#1a1a2e',
        'cyber-navy': '#16213e',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        'green-zone': 'linear-gradient(135deg, rgba(74, 222, 128, 0.8), rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.8))',
        'gold-zone': 'linear-gradient(135deg, rgba(217, 170, 41, 0.8), rgba(184, 134, 11, 0.8), rgba(146, 64, 14, 0.8))',
        'sakura-zone': 'linear-gradient(135deg, rgba(255, 182, 193, 0.8), rgba(255, 105, 180, 0.8), rgba(219, 112, 147, 0.8))',
        'purple-zone': 'linear-gradient(135deg, rgba(147, 51, 234, 0.8), rgba(126, 34, 206, 0.8), rgba(107, 33, 168, 0.8))',
        'orange-zone': 'linear-gradient(135deg, rgba(251, 146, 60, 0.8), rgba(249, 115, 22, 0.8), rgba(234, 88, 12, 0.8))',
        'hp-green': 'linear-gradient(90deg, #22c55e, #16a34a)',
        'hp-gold': 'linear-gradient(90deg, #d9aa29, #b8860b)',
        'hp-sakura': 'linear-gradient(90deg, #ff69b4, #db7093)',
        'hp-purple': 'linear-gradient(90deg, #9333ea, #7e22ce)',
        'hp-orange': 'linear-gradient(90deg, #fb923c, #f97316)',
        'hp-red': 'linear-gradient(90deg, #ef4444, #dc2626)',
        'hp-yellow': 'linear-gradient(90deg, #f59e0b, #d97706)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 255, 0.3)',
        'glow-strong': '0 0 30px rgba(0, 255, 255, 0.5)',
        'hp-green': '0 0 15px rgba(34, 197, 94, 0.5)',
        'hp-gold': '0 0 15px rgba(217, 170, 41, 0.5)',
        'hp-sakura': '0 0 15px rgba(255, 105, 180, 0.5)',
        'hp-purple': '0 0 15px rgba(147, 51, 234, 0.5)',
        'hp-orange': '0 0 15px rgba(251, 146, 60, 0.5)',
      },
      textShadow: {
        'glow': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        'glow-sm': '0 0 5px #00ffff, 0 0 10px #00ffff',
      }
    },
  },
  plugins: [
    // Plugin pour textShadow
    function({ matchUtilities, theme }: { 
      matchUtilities: (utilities: Record<string, (value: string) => Record<string, string>>, options?: { values?: Record<string, string> }) => void;
      theme: (key: string) => Record<string, string>;
    }) {
      matchUtilities(
        {
          'text-shadow': (value: string) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    },
  ],
} satisfies Config