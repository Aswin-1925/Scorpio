/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0C",
        obsidian: "#121216",
        crimson: "#8B1116",
        neon: "#FF2A2A",
        silver: "#C7CBD1",
      },
      fontFamily: {
        epic: ['Syncopate', 'sans-serif'],
        osiris: ['Orbitron', 'sans-serif'],
        folio: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}