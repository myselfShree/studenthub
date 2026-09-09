/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#11120D',
          surface: '#1C1C17',
          elevated: '#24241E',
          subtle: '#171712',
        },
        olive: {
          DEFAULT: '#565449',
          light: '#6E6B5D',
          dark: '#3E3C34',
        },
        content: {
          primary: '#FFFBF4',
          secondary: '#D8CFBC',
          muted: '#8D8777',
        },
        line: {
          DEFAULT: '#36362F',
          subtle: '#262621',
          strong: '#48483F',
        },
        sage: {
          DEFAULT: '#8E9B7A',
          light: '#A3B08E',
          dark: '#738061',
          subtle: '#282F24',
        },
        status: {
          success: '#8E9B7A',
          warning: '#C4975A',
          danger: '#C76A5E',
        }
      },
      fontFamily: {
        display: ['OffBit', 'Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 12px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
