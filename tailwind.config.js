/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        tutorkai: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        'tk-orange': '#FF8B2C',
        'tk-blue': '#2563EB',
        'tk-muted': '#6B7280',
        'tk-border': '#E5E7EB',
        tk: {
          blue: {
            50: "#EBF5FF",
            100: "#D1E9FF", 
            200: "#A6D0FF",
            300: "#70B8FF",
            400: "#47A3FF",
            500: "#1C8EFF",
            600: "#0969DA",
            700: "#0550AE",
            800: "#033D8B",
            900: "#0A2C5C"
          },
          orange: {
            50: "#FFF4ED",
            100: "#FFE6CC",
            200: "#FFCC99",
            300: "#FFB366",
            400: "#FF9933",
            500: "#FF7F00",
            600: "#E6720A",
            700: "#CC6600",
            800: "#B35900",
            900: "#994D00"
          },
          gray: {
            50: "#F8FAFC",
            100: "#F1F5F9",
            200: "#E2E8F0",
            300: "#CBD5E1",
            400: "#94A3B8",
            500: "#64748B",
            600: "#475569",
            700: "#334155",
            800: "#1E293B",
            900: "#0F172A"
          },
          green: {
            50: "#F0FDF4",
            100: "#DCFCE7",
            200: "#BBF7D0",
            300: "#86EFAC",
            400: "#4ADE80",
            500: "#22C55E",
            600: "#16A34A",
            700: "#15803D",
            800: "#166534",
            900: "#14532D"
          }
        },
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      fontSize: {
        'tk-h1': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'tk-h2': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'tk-body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'tk-caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'tk-button': ['14px', { lineHeight: '20px', fontWeight: '500' }],
      },
      borderRadius: {
        'tk-sm': '8px',
        'tk-md': '12px',
        'tk-lg': '16px',
        'tk-xl': '20px',
        'tk-2xl': '24px',
      },
      boxShadow: {
        'tk-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'tk-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'tk-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'tk-card': '0 4px 12px rgba(16, 24, 40, 0.08)',
      },
      spacing: {
        'tk-1': '4px',
        'tk-2': '8px',
        'tk-3': '12px',
        'tk-4': '16px',
        'tk-5': '20px',
        'tk-6': '24px',
        'tk-8': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightish: '-0.01em',
        tight: '-0.02em',
        tighter: '-0.03em',
      },
      fontWeight: {
        'extra-bold': '800',
        'black': '900',
      },
    },
  },
  plugins: [],
}
