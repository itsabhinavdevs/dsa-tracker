/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E1014",
        panel: "#161A21",
        panel2: "#1D222B",
        line: "#2A303B",
        muted: "#7C8494",
        text: "#E7E9EE",
        amber: "#E8A33D",
        teal: "#4FD1C5",
        rose: "#E1636B",
        leaf: "#5FBF77",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
