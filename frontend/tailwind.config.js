/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#22D3EE', // Cyan 400
          foreground: '#0F172A',
        },
        background: '#F8FAFC', // soft off-white
        foreground: '#0F172A', // almost black
        border: '#E2E8F0', // neutral borders
        card: '#FFFFFF',
        'card-foreground': '#0F172A',
        ring: '#4F46E5',
        input: '#E2E8F0',
        muted: '#F1F5F9',
        'muted-foreground': '#475569',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#EEF2FF',
          foreground: '#3730A3',
        },
        accent2: '#22D3EE',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.10)',
        glow: '0 8px 30px rgba(79, 70, 229, 0.30)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4F46E5, #22D3EE)',
      },
    },
  },
  plugins: [],
};
