/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Syne", "system-ui", "sans-serif"],
      },
      colors: {
        laba: {
          bg: "#0c0c14",
          surface: "#161622",
          border: "#32324a",
          accent: "#7c3aed",
          muted: "#8b8b9e",
        },
      },
    },
  },
  plugins: [],
};
