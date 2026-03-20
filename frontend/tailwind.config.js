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
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        primary: {
          DEFAULT: "#FFD600",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#000000",
          foreground: "#FFD600",
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
