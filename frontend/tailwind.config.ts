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
        background: '#faf7ff',
        foreground: '#241034',
        primary: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
          hover: '#6d28d9',
          muted: '#a78bfa',
        },
        secondary: {
          DEFAULT: '#fbbf24',
          foreground: '#3b2300',
          hover: '#f59e0b',
        },
        card: {
          DEFAULT: '#ffffff',
          foreground: '#241034',
          border: '#f0e0ff',
        },
        muted: {
          DEFAULT: '#f4ecfb',
          foreground: '#8b7aa6',
        },
        accent: {
          DEFAULT: '#ffffff',
          foreground: '#241034',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#16a34a',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        border: '#f0e0ff',
        input: '#f0e0ff',
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
        'gradient-hero': 'linear-gradient(160deg, #fdfaff 0%, #f3e8ff 45%, #fdf3d7 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #faf0ff 100%)',
        'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        'glow-border': 'linear-gradient(135deg, #fbbf24, #7c3aed, #fbbf24)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(251, 191, 36, 0.25)',
        'glow-lg': '0 0 60px rgba(124, 58, 237, 0.25)',
        'card': '0 4px 24px rgba(76, 29, 149, 0.08)',
        'card-hover': '0 8px 40px rgba(124, 58, 237, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
