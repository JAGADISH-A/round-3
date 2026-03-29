/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ["Bebas Neue", "display"],
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        nav: ["var(--font-rajdhani)", "sans-serif"],
        tech: ["var(--font-tech-mono)", "monospace"],
        mono: ["var(--font-tech-mono)", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#00FFFF",
          foreground: "#020406",
        },
        secondary: {
          DEFAULT: "#020406",
          foreground: "#00FFFF",
        },
        cyan: {
          neon: "#00FFFF",
          glow: "rgba(0, 255, 255, 0.4)",
        },
        bumblebee: {
          yellow: "#FFD600",
          black: "#000000",
          accent: "#CCAB00",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
};

