import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0011',
        foreground: '#f8fafc',
        primary: {
          DEFAULT: '#c084fc',
          foreground: '#0d0011',
          hover: '#a855f7',
          muted: '#6d28d9',
        },
        secondary: {
          DEFAULT: '#fbbf24',
          foreground: '#0d0011',
          hover: '#f59e0b',
        },
        card: {
          DEFAULT: '#14081c',
          foreground: '#f8fafc',
          border: '#2a1733',
        },
        muted: {
          DEFAULT: '#1f1129',
          foreground: '#b8a6c9',
        },
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#0d0011',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#fbbf24',
          foreground: '#0d0011',
        },
        border: '#2a1733',
        input: '#2a1733',
        ring: '#c084fc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(192, 132, 252, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(135deg, #0d0011 0%, #1a0526 50%, #0d0011 100%)',
        'gradient-card': 'linear-gradient(135deg, #14081c 0%, #1c0d26 100%)',
        'gradient-primary': 'linear-gradient(135deg, #c084fc 0%, #fbbf24 100%)',
        'glow-border': 'linear-gradient(135deg, #c084fc, #fbbf24, #c084fc)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(192, 132, 252, 0.25)',
        'glow-lg': '0 0 60px rgba(192, 132, 252, 0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
