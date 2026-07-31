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
        background: '#170a2b',
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#a78bfa',
          foreground: '#170a2b',
          hover: '#8b5cf6',
          muted: '#7c3aed',
        },
        secondary: {
          DEFAULT: '#fbbf24',
          foreground: '#2d1b00',
          hover: '#f59e0b',
        },
        card: {
          DEFAULT: '#1f0f38',
          foreground: '#ffffff',
          border: '#3b2163',
        },
        muted: {
          DEFAULT: '#2a1547',
          foreground: '#c4b5e6',
        },
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#170a2b',
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
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        border: '#3b2163',
        input: '#3b2163',
        ring: '#fbbf24',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.35)' },
          '50%': { boxShadow: '0 0 45px rgba(251, 191, 36, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': 'linear-gradient(160deg, #170a2b 0%, #2a1250 45%, #1b0a33 100%)',
        'gradient-card': 'linear-gradient(135deg, #1f0f38 0%, #2a1250 100%)',
        'gradient-primary': 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
        'glow-border': 'linear-gradient(135deg, #fbbf24, #a78bfa, #fbbf24)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(251, 191, 36, 0.3)',
        'glow-lg': '0 0 60px rgba(139, 92, 246, 0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.45)',
        'card-hover': '0 8px 40px rgba(251, 191, 36, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
